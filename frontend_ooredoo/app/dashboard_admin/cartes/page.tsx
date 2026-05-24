'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, CheckCircle, XCircle, Clock, Map,
  ArrowLeft, User, Calendar, Wifi, Radio, Globe, PlusCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Carte {
  id: number;
  nom: string;
  description: string;
  statut: string;
  createdAt: string;
  user?: { id: number; name: string; email: string; role: string } | null;
  polygones?: any[];
  service_technologie?: {
    id: number;
    technology?: { nom_technologie: string };
    service?: { nom_service: string };
  } | null;
}

const QUALITE_COLOR: Record<string, string> = {
  bonne:    '#be1526',
  moyenne:  '#ff0921',
  mauvaise: '#d66064',
};

const QUALITE_LABEL: Record<string, string> = {
  bonne:    'Très bonne',
  moyenne:  'Bonne',
  mauvaise: 'Limitée',
};

export default function AdminCartesPage() {
  const router = useRouter();
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [filter, setFilter] = useState('tous');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCartes(); }, []);

  const fetchCartes = async () => {
    try {
      const response = await fetch('http://localhost:3000/cartes-couverture');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCartes(data.filter((c: Carte) => c.user !== null));
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (id: number, newStatut: string) => {
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!response.ok) throw new Error();
      toast.success(newStatut === 'accepte' ? 'Carte acceptée' : 'Carte refusée');
      fetchCartes();
    } catch {
      toast.error('Erreur de mise à jour');
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
      en_attente: { bg: 'bg-amber-50 border-amber-100',   text: 'text-amber-700',   icon: <Clock size={12}/>,       label: 'En attente' },
      accepte:    { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={12}/>, label: 'Acceptée' },
      refuse:     { bg: 'bg-rose-50 border-rose-100',      text: 'text-rose-700',    icon: <XCircle size={12}/>,     label: 'Refusée' },
      publie:     { bg: 'bg-blue-50 border-blue-100',      text: 'text-blue-700',    icon: <Globe size={12}/>,       label: 'Publiée' },
    };
    const config = styles[statut] || styles.en_attente;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const filteredCartes = filter === 'tous' ? cartes : cartes.filter(c => c.statut === filter);

  const filterButtons = [
    { key: 'tous',       label: 'Toutes',      count: cartes.length,                                        color: 'bg-gray-900 text-white' },
    { key: 'en_attente', label: 'En attente',  count: cartes.filter(c => c.statut === 'en_attente').length, color: 'bg-amber-500 text-white' },
    { key: 'accepte',   label: 'Acceptées',    count: cartes.filter(c => c.statut === 'accepte').length,    color: 'bg-emerald-600 text-white' },
    { key: 'refuse',    label: 'Refusées',     count: cartes.filter(c => c.statut === 'refuse').length,     color: 'bg-rose-600 text-white' },
    { key: 'publie',    label: 'Publiées',     count: cartes.filter(c => c.statut === 'publie').length,     color: 'bg-blue-600 text-white' },
  ];

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Chargement des cartes...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-2">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard_admin')} className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cartes de couverture</h1>
            <p className="text-gray-500 font-medium mt-1">
              <span className="text-[#ED1C24] font-bold">{filteredCartes.length}</span> carte(s) trouvée(s)
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 ${
              filter === btn.key ? btn.color : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {btn.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              filter === btn.key ? 'bg-white/30' : 'bg-gray-100'
            }`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {filteredCartes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200"
        >
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Map className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">Aucune carte trouvée</h3>
          <p className="text-gray-400 max-w-xs mx-auto font-medium">
            Aucune carte ne correspond au filtre sélectionné.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCartes.map((carte, index) => (
            <motion.div
              key={carte.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all"
            >
              <div className="flex flex-col h-full">

                {/* Top */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 rounded-2xl text-[#ED1C24] group-hover:bg-[#ED1C24] group-hover:text-white transition-colors">
                    <Map size={24} />
                  </div>
                  {getStatutBadge(carte.statut)}
                </div>

                {/* Nom + Description */}
                <div className="flex-1 space-y-2 mb-4">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-[#ED1C24] transition-colors line-clamp-1">
                    {carte.nom}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {carte.description || 'Aucune description fournie.'}
                  </p>
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <User size={13} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase">Ingénieur</p>
                      <p className="text-xs font-black text-gray-900 truncate">{carte.user?.name || 'Inconnu'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase">Date</p>
                      <p className="text-xs font-black text-gray-900">
                        {carte.createdAt ? new Date(carte.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <Wifi size={13} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase">Technologie</p>
                      <p className="text-xs font-black text-gray-900">{carte.service_technologie?.technology?.nom_technologie || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <Radio size={13} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase">Service</p>
                      <p className="text-xs font-black text-gray-900">{carte.service_technologie?.service?.nom_service || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Qualités */}
                {carte.polygones && carte.polygones.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {carte.polygones.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                        style={{ backgroundColor: QUALITE_COLOR[p.qualite] || '#6b7280' }}
                      >
                        {QUALITE_LABEL[p.qualite] || p.qualite}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    {carte.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatut(carte.id, 'accepte')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle size={12}/> Accepter
                        </button>
                        <button
                          onClick={() => handleUpdateStatut(carte.id, 'refuse')}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle size={12}/> Refuser
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard_admin/cartes/${carte.id}`)}
                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#ED1C24] transition-colors"
                  >
                    Détails <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}