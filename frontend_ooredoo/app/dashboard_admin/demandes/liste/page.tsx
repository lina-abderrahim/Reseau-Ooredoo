'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map, Clock, CheckCircle, XCircle, ArrowLeft,
  User, Calendar, Wifi, Radio, Search, Inbox, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Demande {
  id: number;
  nom: string;
  description: string;
  statut: string;
  date_creation: string;
  ingenieur_nom: string;
  ingenieur_email: string;
  technologie: string;
  service: string;
  qualites: string[];
  commentaire_admin?: string;
}

const QUALITE_COLOR_MAP: Record<string, { bg: string; label: string }> = {
  bonne:    { bg: '#be1526', label: 'Très bonne' },
  moyenne:  { bg: '#ff0921', label: 'Bonne' },
  mauvaise: { bg: '#d66064', label: 'Limitée' },
};

export default function ListeDemandesAdminPage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [filter, setFilter] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDemandes(); }, []);

  const fetchDemandes = async () => {
    try {
      const response = await fetch('http://localhost:3000/demandes-cartes');
      if (response.ok) {
        setDemandes(await response.json());
      } else {
        toast.error('Erreur de chargement');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
      en_attente: { bg: 'bg-amber-50 border-amber-100',     text: 'text-amber-700',   icon: <Clock size={12}/>,       label: 'En attente' },
      accepte:    { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={12}/>, label: 'Acceptée' },
      refuse:     { bg: 'bg-rose-50 border-rose-100',       text: 'text-rose-700',    icon: <XCircle size={12}/>,     label: 'Refusée' },
    };
    const config = styles[statut] || styles.en_attente;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const filteredDemandes = demandes.filter(d => {
    const matchFilter = filter === 'tous' || d.statut === filter;
    const matchSearch = d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.ingenieur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.technologie?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterButtons = [
    { key: 'tous',       label: 'Toutes',     count: demandes.length,                                        color: 'bg-gray-900 text-white' },
    { key: 'en_attente', label: 'En attente', count: demandes.filter(d => d.statut === 'en_attente').length, color: 'bg-amber-500 text-white' },
    { key: 'accepte',    label: 'Acceptées',  count: demandes.filter(d => d.statut === 'accepte').length,    color: 'bg-emerald-600 text-white' },
    { key: 'refuse',     label: 'Refusées',   count: demandes.filter(d => d.statut === 'refuse').length,     color: 'bg-rose-600 text-white' },
  ];

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Chargement...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard_admin')}
            className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group">
            <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Gestion des demandes</h1>
            <p className="text-gray-500 font-medium mt-1">
              <span className="text-[#ED1C24] font-bold">{filteredDemandes.length}</span> demande(s) trouvée(s)
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ED1C24] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Rechercher un projet ou ingénieur..."
            className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl w-full md:w-72 outline-none focus:border-[#ED1C24] transition-all shadow-sm font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {filterButtons.map(btn => (
          <button key={btn.key} onClick={() => setFilter(btn.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 ${
              filter === btn.key ? btn.color : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {btn.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${filter === btn.key ? 'bg-white/30' : 'bg-gray-100'}`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {filteredDemandes.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Inbox className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic mb-2">Aucune demande trouvée</h3>
          <p className="text-gray-400 font-medium">Réessayez avec un autre filtre ou terme de recherche.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDemandes.map((demande, index) => (
            <motion.div key={demande.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* Top */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="p-3 bg-red-50 rounded-2xl text-[#ED1C24] group-hover:bg-[#ED1C24] group-hover:text-white transition-colors">
                      <Map size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="text-lg font-black text-gray-900 uppercase italic group-hover:text-[#ED1C24] transition-colors">
                          {demande.nom}
                        </h3>
                        {getStatutBadge(demande.statut)}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {demande.qualites?.map(q => {
                          const config = QUALITE_COLOR_MAP[q] || { bg: '#6b7280', label: q };
                          return (
                            <span key={q} className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white"
                              style={{ backgroundColor: config.bg }}>
                              {config.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm font-medium italic bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100 line-clamp-2">
                    "{demande.description || 'Aucune description'}"
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <SmallInfo icon={<User size={12}/>} label="Ingénieur" value={demande.ingenieur_nom || 'N/A'} />
                    <SmallInfo icon={<Calendar size={12}/>} label="Date" value={new Date(demande.date_creation).toLocaleDateString('fr-FR')} />
                    <SmallInfo icon={<Wifi size={12}/>} label="Technologie" value={demande.technologie} />
                    <SmallInfo icon={<Radio size={12}/>} label="Service" value={demande.service} />
                  </div>
                </div>

                {/* ✅ Bouton Consulter */}
                <Link href={`/dashboard_admin/demandes/${demande.id}`}>
                  <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#ED1C24] transition-colors whitespace-nowrap">
                    Consulter <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmallInfo({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-black text-gray-800 uppercase truncate">{value}</p>
    </div>
  );
}


