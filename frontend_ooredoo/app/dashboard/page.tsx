'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Map, Clock, CheckCircle, PlusCircle,
  XCircle, ChevronRight, Layers
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  delay: number;
  loading: boolean;
  href: string;
}

interface Demande {
  id: number;
  nom: string;
  technologie: string;
  service: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  date_creation: string;
}

const StatCard = ({ title, value, icon, subtitle, delay, loading, href }: StatCardProps) => (
  <Link href={href} className="block">
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-red-600 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        {loading ? (
          <div className="h-9 w-14 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
        )}
      </div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-xs text-gray-400 group-hover:text-red-600 font-medium transition-colors duration-300">{subtitle}</p>
    </motion.div>
  </Link>
);

const Badge = ({ statut }: { statut: string }) => {
  const configs: Record<string, { color: string; label: string }> = {
    en_attente: { color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'En attente' },
    accepte:    { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Validée' },
    refuse:     { color: 'text-red-700 bg-red-50 border-red-200',        label: 'Rejetée' },
  };
  const config = configs[statut] || configs.en_attente;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

export default function IngenieurDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    attente: 0,
    accepte: 0,
    refuse: 0,
  });
  const [recentDemandes, setRecentDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async (id: number, email: string) => {
    setLoading(true);
    try {
      const [cartesRes, demandesRes] = await Promise.all([
        fetch('http://localhost:3000/cartes-couverture'),
        fetch(`http://localhost:3000/demandes-cartes/ingenieur-email/${encodeURIComponent(email)}`)
      ]);

      if (cartesRes.ok) {
        const data = await cartesRes.json();
        const mesCartes = data.filter((c: any) => c.user?.id === id);
        setStats({
          total: mesCartes.length,
          attente: mesCartes.filter((c: any) => c.statut === 'en_attente').length,
          accepte: mesCartes.filter((c: any) => c.statut === 'accepte').length,
          refuse: mesCartes.filter((c: any) => c.statut === 'refuse').length,
        });
      }

      if (demandesRes.ok) {
        const data = await demandesRes.json();
        setRecentDemandes(
          data
            .sort((a: any, b: any) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
            .slice(0, 5)
        );
      }
    } catch (err) {
      console.error("Erreur de synchronisation:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      setUserName(user.name || 'Ingénieur');
      fetchDashboardData(user.id, user.email);
    }
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen space-y-10 pb-16 px-4 max-w-7xl mx-auto bg-gray-50/50">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Session Live
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Tableau de bord, <span className="text-red-600">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Planification et gestion du réseau cartographique SIG Ooredoo
          </p>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mes Cartes"
          value={stats.total}
          icon={<Layers size={20} />}
          subtitle="Total des cartes créées"
          delay={0.05}
          loading={loading}
          href="/dashboard/cartes"
        />
        <StatCard
          title="En Validation"
          value={stats.attente}
          icon={<Clock size={20} />}
          subtitle="En attente de revue"
          delay={0.1}
          loading={loading}
          href="/dashboard/cartes"
        />
        <StatCard
          title="Validées"
          value={stats.accepte}
          icon={<CheckCircle size={20} />}
          subtitle="Cartes approuvées"
          delay={0.15}
          loading={loading}
          href="/dashboard/cartes"
        />
        <StatCard
          title="Rejetées"
          value={stats.refuse}
          icon={<XCircle size={20} />}
          subtitle="À corriger et resoumettre"
          delay={0.2}
          loading={loading}
          href="/dashboard/cartes"
        />
      </section>

      {/* Flux de demandes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-red-600 rounded-sm" /> Flux récent des demandes
          </h2>
          <Link href="/dashboard/demandes" className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors border-b border-transparent hover:border-red-600 pb-0.5">
            Voir tout le registre
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {recentDemandes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentDemandes.map((demande) => (
                <div key={demande.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50/50 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider border border-red-100">
                      {demande.technologie}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{demande.nom}</p>
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-500">
                        <span className="font-medium">{demande.service}</span>
                        <span className="text-gray-300">•</span>
                        <span>{new Date(demande.date_creation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                    <Badge statut={demande.statut} />
                    <Link href={`/dashboard/demandes/${demande.id}`}>
                      <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:border-red-600 hover:text-red-600 transition-all shadow-sm">
                        <ChevronRight size={16} />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-gray-400 text-sm font-medium">
              Aucune activité enregistrée pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* Section Planification / Nouvelle Carte */}
      <section>
        <motion.div
          whileHover={{ y: -1 }}
          className="relative rounded-2xl bg-white border border-gray-100 p-8 md:p-10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Subtle grid pattern backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f9fafb_1px,transparent_1px),linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-100" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-red-50 border border-red-100 rounded-md mb-4">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Ooredoo SIG Tool</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                Initialiser une <span className="text-red-600">nouvelle carte ?</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Accédez instantanément au canevas cartographique pour configurer les couches géospatiales, définir les polygones de couverture et analyser l'infrastructure radio (2G/3G/4G/5G).
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <Link
                href="/dashboard/creer"
                className="group inline-flex items-center justify-center gap-3 w-full lg:w-auto bg-red-600 text-white px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-red-700 shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/10 text-white">
                  <Map size={16} className="group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span>Créer un plan libre</span>
                <PlusCircle size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}