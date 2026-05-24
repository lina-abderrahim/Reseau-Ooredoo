'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Map, Calendar, Wifi, Radio, Clock, 
  CheckCircle, XCircle, User, PlusCircle, Send, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DemandeCarte {
  id: string | number;
  nom: string;
  description?: string;
  technologie: string;
  service: string;
  qualites: string[];
  polygones?: any[];
  statut: 'en_attente' | 'accepte' | 'refuse';
  date_creation: string;
  commentaire_admin?: string;
  ingenieur_nom?: string;
  ingenieur_email?: string;
}

export default function AdminDemandeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [demande, setDemande] = useState<DemandeCarte | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRefusModal, setShowRefusModal] = useState<boolean>(false);
  const [justification, setJustification] = useState<string>('');
  const [refusLoading, setRefusLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchDemande = async () => {
      try {
        const response = await fetch(`http://localhost:3000/demandes-cartes/${id}`, {
          signal: controller.signal
        });
        if (response.ok) {
          const data: DemandeCarte = await response.json();
          setDemande(data);
        } else {
          toast.error('Erreur de chargement des données');
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error('Erreur de connexion au serveur');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDemande();
    return () => controller.abort();
  }, [id]);

  const handleCreateCard = async () => {
    if (!demande) return;
    if (demande.statut === 'en_attente') {
      try {
        await fetch(`http://localhost:3000/demandes-cartes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: 'accepte' }),
        });
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
    const carteData = {
      nom: demande.nom,
      description: demande.description,
      technologie: demande.technologie,
      service: demande.service,
      qualites: demande.qualites,
      polygones: demande.polygones || [],
      demande_id: demande.id
    };
    localStorage.setItem('carte_from_demande', JSON.stringify(carteData));
    toast.success('Données transférées vers le créateur');
    router.push('/dashboard/creer?from=demande');
  };

  const handleRefuser = async () => {
    if (!justification.trim()) {
      toast.error('Veuillez écrire une justification');
      return;
    }
    setRefusLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/demandes-cartes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'refuse',
          commentaire_admin: justification,
        }),
      });
      if (response.ok) {
        toast.success('Demande refusée');
        setDemande((prev) => prev ? {
          ...prev,
          statut: 'refuse',
          commentaire_admin: justification
        } : null);
        setShowRefusModal(false);
      } else {
        toast.error('Erreur lors du traitement du refus');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setRefusLoading(false);
    }
  };

  const getQualiteColor = (qualite: string): string => {
    switch (qualite) {
      case 'bonne':    return '#be1526';
      case 'moyenne':  return '#ff0921';
      case 'mauvaise': return '#d66064';
      default:         return '#6b7280';
    }
  };

  const getQualiteLabel = (qualite: string): string => {
    switch (qualite) {
      case 'bonne':    return 'Très bonne';
      case 'moyenne':  return 'Bonne';
      case 'mauvaise': return 'Limitée';
      default:         return qualite;
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Chargement...</p>
    </div>
  );

  if (!demande) return (
    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
      <AlertTriangle className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-xl font-black italic">DEMANDE INTROUVABLE</h3>
      <button onClick={() => router.push('/dashboard_admin/demandes/liste')} className="mt-4 inline-block text-[#ED1C24] font-bold hover:underline">
        Retour à la liste
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard_admin/demandes/liste')}
          className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group"
        >
          <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-black italic uppercase tracking-tight">Détail de la demande</h1>
          <p className="text-[#ED1C24] font-black text-sm">RÉFÉRENCE : #{demande.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">

        {/* Header Section */}
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#ED1C24] rounded-2xl shadow-lg shadow-red-500/20 text-white">
              <Map size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2 uppercase">{demande.nom}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {demande.qualites?.map((q: string) => (
                  <span
                    key={q}
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: getQualiteColor(q),
                      borderColor: getQualiteColor(q),
                      color: 'white',
                    }}
                  >
                    {getQualiteLabel(q)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            {demande.statut === 'en_attente' && (
              <span className="flex items-center gap-2 px-5 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-black border border-amber-200 uppercase tracking-widest">
                <Clock size={14}/> En attente
              </span>
            )}
            {demande.statut === 'accepte' && (
              <span className="flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-200 uppercase tracking-widest">
                <CheckCircle size={14}/> Acceptée
              </span>
            )}
            {demande.statut === 'refuse' && (
              <span className="flex items-center gap-2 px-5 py-2 bg-rose-50 text-rose-700 rounded-full text-xs font-black border border-rose-200 uppercase tracking-widest">
                <XCircle size={14}/> Refusée
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Description du projet</h3>
            <p className="text-gray-700 bg-white p-5 rounded-2xl border border-gray-100 font-medium leading-relaxed italic shadow-sm">
              "{demande.description || 'Aucune description fournie'}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard icon={<User size={16} />} label="Ingénieur" value={demande.ingenieur_nom || 'N/A'} />
            <InfoCard
              icon={<Calendar size={16} />}
              label="Date de dépôt"
              value={demande.date_creation
                ? new Date(demande.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                : 'Inconnue'}
            />
            <InfoCard icon={<Wifi size={16} />} label="Technologie" value={demande.technologie} />
            <InfoCard icon={<Radio size={16} />} label="Service" value={demande.service} />
          </div>

          {demande.statut === 'refuse' && demande.commentaire_admin && (
            <div className="bg-rose-50/50 border-2 border-rose-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10"><AlertTriangle size={60} /></div>
              <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2">
                Raison du refus
              </h3>
              <p className="text-rose-900 font-bold italic leading-relaxed">{demande.commentaire_admin}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
          {demande.statut === 'en_attente' && (
            <>
              <button
                onClick={handleCreateCard}
                className="flex-[2] bg-emerald-600 hover:bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg"
              >
                <PlusCircle size={20} /> Valider et créer le plan
              </button>
              <button
                onClick={() => setShowRefusModal(true)}
                className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <XCircle size={20} /> Refuser
              </button>
            </>
          )}

          {demande.statut === 'accepte' && (
            <button
              onClick={handleCreateCard}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#ED1C24] transition-all shadow-xl"
            >
              <PlusCircle size={20} /> Créer la carte maintenant
            </button>
          )}

          {demande.statut === 'refuse' && (
            <div className="w-full bg-rose-100/50 border border-rose-200 rounded-2xl py-4 flex items-center justify-center gap-3">
              <XCircle size={18} className="text-rose-600" />
              <span className="text-rose-700 font-black uppercase text-[10px] tracking-widest">Demande archivée (Refusée)</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Refus */}
      {showRefusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-2 italic">REFUSER LA DEMANDE</h2>
            <p className="text-gray-400 text-sm mb-6 font-medium">
              Veuillez fournir une explication claire enregistrée dans l'historique.
            </p>
            <textarea
              rows={4}
              placeholder="Ex: Les ressources pour cette zone sont saturées..."
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] text-gray-800 font-bold italic resize-none mb-6 transition-all"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRefusModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleRefuser}
                disabled={refusLoading}
                className="flex-[2] px-6 py-4 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Send size={16} />
                {refusLoading ? 'Envoi...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="text-gray-400 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="font-black text-gray-900 text-xs uppercase">{value}</p>
      </div>
    </div>
  );
}