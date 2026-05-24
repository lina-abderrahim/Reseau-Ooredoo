'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Map, PlusCircle, Clock, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Carte {
  id: number;
  nom: string;
  description: string;
  statut: string;
  createdAt?: string;
  user?: { id: number; name: string; email: string };
}

export default function MesCartesPage() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      fetchCartes(user.id);
    } catch (e) {
      console.error("Erreur parsing user");
    }
  }, []);

  const fetchCartes = async (userId: number) => {
    try {
      const response = await fetch('http://localhost:3000/cartes-couverture');
      if (response.ok) {
        const data = await response.json();
        const mesCartes = data.filter((carte: Carte) => carte.user?.id === userId);
        setCartes(mesCartes);
      } else {
        toast.error('Erreur de chargement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
      accepte: { 
        bg: 'bg-emerald-50 border-emerald-100', 
        text: 'text-emerald-700', 
        icon: <CheckCircle size={12}/>, 
        label: 'Acceptée' 
      },
      refuse: { 
        bg: 'bg-rose-50 border-rose-100', 
        text: 'text-rose-700', 
        icon: <XCircle size={12}/>, 
        label: 'Refusée' 
      },
      en_attente: { 
        bg: 'bg-amber-50 border-amber-100', 
        text: 'text-amber-700', 
        icon: <Clock size={12}/>, 
        label: 'En attente' 
      }
    };

    const config = styles[statut] || styles.en_attente;

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Chargement de vos cartes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mes cartes SIG</h1>
          <p className="text-gray-500 font-medium mt-1">
            Vous avez publié <span className="text-red-600 font-bold">{cartes.length}</span> projet(s) de couverture.
          </p>
        </div>
        <Link href="/dashboard/creer">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#ED1C24] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-black transition-all"
          >
            <PlusCircle size={18} /> Nouvelle conception
          </motion.button>
        </Link>
      </div>

      {cartes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200"
        >
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Map className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">Votre inventaire est vide</h3>
          <p className="text-gray-400 max-w-xs mx-auto mb-8 font-medium">
            Commencez à modéliser le réseau en créant votre première carte de couverture.
          </p>
          <Link href="/dashboard/creer">
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ED1C24] transition-all">
              Créer ma première carte
            </button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cartes.map((carte, index) => (
            <motion.div
              key={carte.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 rounded-2xl text-[#ED1C24] group-hover:bg-[#ED1C24] group-hover:text-white transition-colors">
                    <Map size={24} />
                  </div>
                  {getStatutBadge(carte.statut)}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-[#ED1C24] transition-colors line-clamp-1">
                    {carte.nom}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {carte.description || 'Aucune description fournie pour ce projet.'}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-tighter">
                      {carte.createdAt ? new Date(carte.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date inconnue'}
                    </span>
                  </div>
                  
                  <Link href={`/dashboard/cartes/${carte.id}`}>
                    <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#ED1C24] transition-colors">
                      Détails <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}