'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, Map, User, Calendar, Wifi, Radio, 
  Clock, CheckCircle, XCircle, Copy, FileText, 
  StickyNote
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReadOnlyMap = dynamic(() => import('@/components/ReadOnlyMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
      <p className="text-gray-400 font-medium">Chargement de l'aperçu...</p>
    </div>
  )
});

export default function IngenieurCarteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [carte, setCarte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  useEffect(() => {
    const fetchCarte = async () => {
      try {
        const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`);
        if (!response.ok) {
          toast.error('Carte introuvable');
          setCarte(null);
          return;
        }
        const data = await response.json();
        setCarte(data);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };
    fetchCarte();
  }, [id]);

  const handleDuplicate = async () => {
    if (!carte) return;
    setDuplicateLoading(true);
    const toastId = toast.loading('Duplication de la carte en cours...');
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) { router.push('/login'); return; }
      const user = JSON.parse(raw);

      const response = await fetch('http://localhost:3000/cartes-couverture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `${carte.nom} (copie)`,
          description: carte.description || '',
          statut: 'en_attente',
          user_id: user.id,
          service_technologie_id: carte.service_technologie?.id,
          polygones: carte.polygones?.map((p: any) => ({
            coordinates: p.coordinates,
            qualite: p.qualite,
          })) || [],
        }),
      });

      if (response.ok) {
        const newCarte = await response.json();
        try {
          await fetch(`http://localhost:3000/cartes-couverture/duplicate-shp/${id}/${newCarte.id}`, {
            method: 'POST',
          });
        } catch (e) {
          console.error('Erreur duplication SHP:', e);
        }
        toast.success('Carte dupliquée avec succès', { id: toastId });
        router.push(`/dashboard/cartes/${newCarte.id}/modifier`);
      } else {
        toast.error('Erreur lors de la duplication', { id: toastId });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion', { id: toastId });
    } finally {
      setDuplicateLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      en_attente: "bg-yellow-50 text-yellow-700 border-yellow-200",
      accepte: "bg-green-50 text-green-700 border-green-200",
      refuse: "bg-red-50 text-red-700 border-red-200",
      publie: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const icons: Record<string, any> = {
      en_attente: <Clock size={14}/>,
      accepte: <CheckCircle size={14}/>,
      refuse: <XCircle size={14}/>,
      publie: <CheckCircle size={14}/>,
    };
    const label: Record<string, string> = {
      en_attente: "En attente de validation",
      accepte: "Acceptée",
      refuse: "Refusée",
      publie: "Publiée",
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${styles[statut] || "bg-gray-100"}`}>
        {icons[statut]}
        {label[statut] || statut}
      </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold animate-pulse uppercase text-xs tracking-widest">Chargement des données...</p>
    </div>
  );

  if (!carte) return (
    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
      <XCircle size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-black italic">CARTE INTROUVABLE</h3>
      <Link href="/dashboard/cartes" className="mt-4 inline-block text-[#ED1C24] font-bold hover:underline">
        Retourner à la liste
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cartes" className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-black italic uppercase tracking-tight">{carte.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 text-sm font-bold">Plan de couverture réseau</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[#ED1C24] text-sm font-black">ID #{carte.id}</span>
            </div>
          </div>
        </div>
        {getStatutBadge(carte.statut)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Colonne gauche */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Spécifications</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><Wifi size={18} /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Technologie</p>
                    <p className="font-black text-sm">{carte.service_technologie?.technology?.nom_technologie || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><Radio size={18} /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Service</p>
                    <p className="font-black text-sm">{carte.service_technologie?.service?.nom_service || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">{carte.user?.name || 'Utilisateur inconnu'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">
                    {carte.createdAt ? new Date(carte.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {carte.description && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Notes du Projet</h3>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{carte.description}"</p>
              </div>
            )}
          </div>

          {/* ✅ Actions */}
          <div className="space-y-3">

            {/* Dupliquer — uniquement si refusée */}
            {carte.statut === 'refuse' && (
              <div className="space-y-4">
                <button
                  onClick={handleDuplicate}
                  disabled={duplicateLoading}
                  className="w-full py-4 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  <Copy size={18} />
                  {duplicateLoading ? 'Traitement...' : 'Dupliquer pour corriger'}
                </button>
                <p className="text-[10px] text-gray-400 text-center font-bold px-4">
                  * Crée une copie modifiable pour soumission rapide.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-6">

          {/* Carte */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map size={18} className="text-[#ED1C24]" />
                <span className="text-xs font-black uppercase tracking-widest">Aperçu Géographique</span>
              </div>
              {carte.statut === 'refuse' && carte.type_commentaire === 'note' && (
                <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-tighter">
                  Cliquez sur 📝 pour voir les retours
                </span>
              )}
            </div>
            <div className="h-[500px] w-full relative">
              <ReadOnlyMap
                polygons={carte.polygones || []}
                commentaire_refus={carte.commentaire_refus}
                type_commentaire={carte.type_commentaire}
                carteId={carte.id}
              />
            </div>
          </div>

          {/* Commentaire de refus */}
          {carte.statut === 'refuse' && carte.commentaire_refus && (
            <div className="bg-red-50 rounded-3xl border-2 border-red-100 p-6 space-y-4 shadow-sm shadow-red-500/5">
              <div className="flex items-center gap-3 border-b border-red-200 pb-3">
                {carte.type_commentaire === 'rapport'
                  ? <FileText size={20} className="text-red-600" />
                  : <StickyNote size={20} className="text-red-600" />
                }
                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest">
                  {carte.type_commentaire === 'rapport' ? "Rapport d'expertise" : "Notes de correction"}
                </h4>
              </div>

              {carte.type_commentaire === 'rapport' ? (
                <p className="text-red-900 font-medium text-sm whitespace-pre-line leading-relaxed italic">
                  {carte.commentaire_refus}
                </p>
              ) : (
                <div className="grid gap-3">
                  {(() => {
                    try {
                      const notes = JSON.parse(carte.commentaire_refus);
                      return notes.map((note: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-red-200">
                          <span className="mt-0.5">📝</span>
                          <p className="text-sm text-red-800 font-bold italic">{note.texte}</p>
                        </div>
                      ));
                    } catch {
                      return <p className="text-red-800 text-sm font-bold italic">{carte.commentaire_refus}</p>;
                    }
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}