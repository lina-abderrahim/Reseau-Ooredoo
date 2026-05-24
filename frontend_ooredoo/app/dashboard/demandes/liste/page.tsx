'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, Map, Clock, CheckCircle, XCircle, 
  ArrowLeft, User, Calendar, Wifi, Radio, 
  Search, Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Demande {
  id: number;
  nom: string;
  description: string;
  statut: string;
  date_creation: string;
  ingenieur_nom: string;
  technologie: string;
  service: string;
}

// Couleurs harmonisées avec MapComponent.tsx
const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    "#be1526",
  moyenne:  "#ff0921",
  mauvaise: "#d66064",
};

export default function ListeDemandesPage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [filter, setFilter] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await fetch('http://localhost:3000/demandes-cartes');
      if (response.ok) {
        const data = await response.json();
        setDemandes(data);
      } else {
        toast.error('Erreur de chargement des demandes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      en_attente: "text-amber-700 bg-amber-50 border-amber-200",
      accepte: "text-emerald-700 bg-emerald-50 border-emerald-200",
      refuse: "text-rose-700 bg-rose-50 border-rose-200",
    };
    
    const icons = {
      en_attente: <Clock size={14} />,
      accepte: <CheckCircle size={14} />,
      refuse: <XCircle size={14} />,
    };

    const labels = {
      en_attente: "En attente",
      accepte: "Acceptée",
      refuse: "Refusée",
    };

    const currentStyle = badges[statut as keyof typeof badges] || "bg-gray-100 text-gray-600";

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${currentStyle}`}>
        {icons[statut as keyof typeof icons]}
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const filteredDemandes = demandes.filter(d => {
    const matchesFilter = filter === 'tous' || d.statut === filter;
    const matchesSearch = d.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.ingenieur_nom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0921]" />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Récupération des données...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header avec Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => router.push('/dashboard_admin')} 
            className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-all group"
          >
            <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Gestion des Demandes</h1>
            <p className="font-bold text-sm tracking-wide" style={{ color: QUALITE_COLOR_MAP.moyenne }}>
              {filteredDemandes.length} demande(s) filtrée(s)
            </p>
          </div>
        </div>

        {/* Barre de recherche rapide */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff0921] transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un projet ou un ingénieur..."
            className="pl-12 pr-6 py-3.5 bg-white border border-gray-200 rounded-2xl w-full md:w-80 outline-none focus:border-[#ff0921] focus:ring-4 focus:ring-[#ff0921]/5 transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filtres de Statut */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 border border-gray-200 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'tous', label: 'Toutes', count: demandes.length, color: 'bg-black text-white' },
          { id: 'en_attente', label: 'En attente', count: demandes.filter(d => d.statut === 'en_attente').length, color: 'bg-amber-500 text-white' },
          { id: 'accepte', label: 'Acceptées', count: demandes.filter(d => d.statut === 'accepte').length, color: 'bg-emerald-600 text-white' },
          { id: 'refuse', label: 'Refusées', count: demandes.filter(d => d.statut === 'refuse').length, color: 'bg-rose-600 text-white' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${
              filter === btn.id ? btn.color + ' shadow-md' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {btn.label}
            <span className={`px-2 py-0.5 rounded-md text-[10px] ${filter === btn.id ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des cartes */}
      {filteredDemandes.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-xl shadow-black/5">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">Aucune donnée trouvée</h3>
          <p className="text-gray-400 mt-2 font-medium">Réessayez avec un autre filtre ou une autre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDemandes.map((demande) => (
            <div 
              key={demande.id} 
              className="group bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-2xl hover:shadow-red-500/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 text-white rounded-2xl shadow-lg" style={{ backgroundColor: QUALITE_COLOR_MAP.moyenne }}>
                    <Map size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{demande.nom}</h3>
                      {getStatutBadge(demande.statut)}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1 font-medium italic">
                      {demande.description || "Aucun complément d'information"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <SmallInfo icon={<User size={12}/>} label="Demandé par" value={demande.ingenieur_nom} />
                  <SmallInfo icon={<Calendar size={12}/>} label="Soumis le" value={new Date(demande.date_creation).toLocaleDateString('fr-FR')} />
                  <SmallInfo icon={<Wifi size={12}/>} label="Réseau" value={demande.technologie} />
                  <SmallInfo icon={<Radio size={12}/>} label="Service" value={demande.service} />
                </div>
              </div>

              <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 flex items-center justify-end">
                <Link href={`/dashboard_admin/demandes/${demande.id}`} className="w-full">
                  <button className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all shadow-lg group-hover:scale-105">
                    Consulter <Eye size={16} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmallInfo({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-gray-50/80 px-4 py-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-black text-gray-800 uppercase">{value}</p>
    </div>
  );
}