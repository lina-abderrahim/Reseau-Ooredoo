'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, Map, PlusCircle, XCircle, CheckCircle, 
  Clock, Send, Inbox, Calendar, Wifi, Radio 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Demande {
  id: number;
  nom: string;
  description: string;
  statut: string;
  date_creation: string;
  technologie: string;
  service: string;
  qualites: string[];
  ingenieur_email: string;
  polygones?: any[];
}

const QUALITE_COLOR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  bonne:    { bg: "#be1526", text: "#ffffff", label: "Très bonne" },
  moyenne:  { bg: "#ff0921", text: "#ffffff", label: "Bonne" },
  mauvaise: { bg: "#d66064", text: "#ffffff", label: "Limitée" },
};

export default function MesDemandesPage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [justification, setJustification] = useState('');
  const [refusLoading, setRefusLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) { router.push('/login'); return; }
    const user = JSON.parse(raw);
    if (!user?.email) { router.push('/login'); return; }
    setUserEmail(user.email);
    fetchDemandes(user.email);
  }, [router]);

  const fetchDemandes = async (email: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/demandes-cartes/ingenieur-email/${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDemandes(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = (demande: Demande) => {
    localStorage.setItem('demande_id_source', String(demande.id));
    localStorage.setItem('qualites_requises', JSON.stringify(demande.qualites));
    const carteData = {
      nom: demande.nom,
      description: demande.description,
      technologie: demande.technologie,
      service: demande.service,
      qualites: demande.qualites,
      polygones: demande.polygones || [],
    };
    localStorage.setItem('carte_from_demande', JSON.stringify(carteData));
    toast.success('Configuration de la demande chargée');
    router.push('/dashboard/creer?from=demande');
  };

  const openRefusModal = (id: number) => {
    setSelectedDemandeId(id);
    setJustification('');
    setShowRefusModal(true);
  };

  const handleRefuser = async () => {
    if (!justification.trim()) {
      toast.error('⚠️ Veuillez écrire une justification');
      return;
    }
    if (!selectedDemandeId) return;
    setRefusLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/demandes-cartes/${selectedDemandeId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statut: 'refuse',
            commentaire_admin: justification,
          }),
        }
      );
      if (response.ok) {
        toast.success('Demande refusée');
        setDemandes(prev =>
          prev.map(d => d.id === selectedDemandeId ? { ...d, statut: 'refuse' } : d)
        );
        setShowRefusModal(false);
      } else {
        toast.error('Erreur lors du refus');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setRefusLoading(false);
    }
  };

  const getQualitesBadges = (qualites: string[]) => {
    if (!qualites || qualites.length === 0) return null;
    return (
      <div className="flex gap-1.5 mt-1">
        {qualites.map(q => {
          const config = QUALITE_COLOR_MAP[q] || { bg: '#6b7280', text: '#ffffff', label: q };
          return (
            <span 
              key={q} 
              style={{ backgroundColor: config.bg, color: config.text }}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
            >
              {config.label}
            </span>
          );
        })}
      </div>
    );
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      en_attente: "bg-amber-50 text-amber-700 border-amber-200",
      accepte: "bg-emerald-50 text-emerald-700 border-emerald-200",
      refuse: "bg-rose-50 text-rose-700 border-rose-200",
    };
    const icons = {
      en_attente: <Clock size={12}/>,
      accepte: <CheckCircle size={12}/>,
      refuse: <XCircle size={12}/>,
    };
    const labels = { en_attente: 'En attente', accepte: 'Acceptée', refuse: 'Refusée' };

    return (
      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${styles[statut as keyof typeof styles]}`}>
        {icons[statut as keyof typeof icons]}
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0921]" />
        <p className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase">Chargement de vos dossiers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight">Mes Demandes</h1>
          <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
            Assignées à : <span className="font-bold text-[#ff0921]">{userEmail}</span>
          </p>
        </div>
        <Link href="/dashboard/creer">
          <button className="bg-black text-white px-6 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-[#ff0921] transition-all shadow-xl shadow-black/10 active:scale-95">
            <PlusCircle size={18} /> Nouvelle carte libre
          </button>
        </Link>
      </div>

      {/* Empty State */}
      {demandes.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-xl shadow-black/5">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Map className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">Aucune demande assignée</h3>
          <p className="text-gray-400 mt-2 font-medium mb-6">
            L'administrateur n'a pas encore créé de demandes de planification réseau pour votre compte.
          </p>
          <Link href="/dashboard/creer">
            <button className="inline-flex items-center gap-3 bg-red-600 text-white px-6 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg shadow-red-500/10">
              <PlusCircle size={16} /> Créer une carte libre
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {demandes.map((demande) => (
            <div key={demande.id} className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-300 overflow-hidden relative">
              
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Section Gauche : Infos Principales */}
                <div className="flex-1 space-y-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="p-3 text-white rounded-2xl shadow-lg" style={{ backgroundColor: QUALITE_COLOR_MAP.moyenne.bg }}>
                      <Map size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{demande.nom}</h3>
                        {getStatutBadge(demande.statut)}
                      </div>
                      {getQualitesBadges(demande.qualites)}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm font-medium italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    "{demande.description || 'Aucune description spécifique pour cette demande'}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InfoBox icon={<Calendar size={14}/>} label="Soumis le" value={new Date(demande.date_creation).toLocaleDateString()} />
                    <InfoBox icon={<Wifi size={14}/>} label="Technologie" value={demande.technologie} />
                    <InfoBox icon={<Radio size={14}/>} label="Service" value={demande.service} />
                  </div>
                </div>

                {/* Section Droite : Actions */}
                <div className="flex flex-row lg:flex-col justify-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50 min-w-[200px]">
                  <Link href={`/dashboard/demandes/${demande.id}`} className="flex-1 lg:flex-none">
                    <button className="w-full px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                      <Eye size={16} /> Détails
                    </button>
                  </Link>
                  
                  {demande.statut !== 'refuse' && (
                    <button
                      onClick={() => handleCreateCard(demande)}
                      className="flex-1 lg:flex-none px-5 py-3.5 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                    >
                      <PlusCircle size={16} /> Configurer
                    </button>
                  )}

                  {(demande.statut === 'en_attente' || demande.statut === 'accepte') && (
                    <button
                      onClick={() => openRefusModal(demande.id)}
                      className="flex-1 lg:flex-none px-5 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Refuser
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Refus */}
      {showRefusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-2 italic">REFUSER LA MISSION</h2>
            <p className="text-gray-400 text-sm mb-6 font-medium leading-relaxed">
              Veuillez indiquer pourquoi vous ne pouvez pas traiter cette demande. L'administrateur recevra votre notification.
            </p>
            <textarea
              rows={4}
              placeholder="Ex: Erreur de technologie cible, zone géographique hors secteur..."
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ff0921] text-gray-800 font-bold italic resize-none mb-6 transition-all"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRefusModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleRefuser}
                disabled={refusLoading}
                className="flex-[2] px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-red-500/20"
              >
                <Send size={16} />
                {refusLoading ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-gray-50/80 px-4 py-3 rounded-xl border border-gray-100 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-black text-gray-800 uppercase">{value}</p>
    </div>
  );
}