'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Map, FileText, Users, Clock,
  CheckCircle, ChevronRight,
  Activity, Globe, PlusCircle, Layers
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

interface Carte {
  id: number;
  nom: string;
  statut: string;
  createdAt: string;
  user?: { name: string; email: string };
}

interface Demande {
  id: number;
  nom: string;
  technologie: string;
  service: string;
  statut: string;
  date_creation: string;
  ingenieur_nom: string;
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
    publie:     { color: 'text-blue-700 bg-blue-50 border-blue-200',      label: 'Publiée' },
  };
  const config = configs[statut] || configs.en_attente;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

export default function AdminDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    totalCartes: 0,
    enAttente: 0,
    accepte: 0,
    publie: 0,
    totalDemandes: 0,
    totalIngenieurs: 0,
  });
  const [recentCartes, setRecentCartes] = useState<Carte[]>([]);
  const [recentDemandes, setRecentDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [cartesRes, demandesRes, usersRes] = await Promise.all([
        fetch('http://localhost:3000/cartes-couverture'),
        fetch('http://localhost:3000/demandes-cartes'),
        fetch('http://localhost:3000/users?role=ingenieur'),
      ]);

      if (cartesRes.ok) {
        const cartes: Carte[] = await cartesRes.json();
        setStats(prev => ({
          ...prev,
          totalCartes: cartes.length,
          enAttente: cartes.filter(c => c.statut === 'en_attente').length,
          accepte: cartes.filter(c => c.statut === 'accepte').length,
          publie: cartes.filter(c => c.statut === 'publie').length,
        }));
        setRecentCartes(
          [...cartes]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        );
      }

      if (demandesRes.ok) {
        const demandes: Demande[] = await demandesRes.json();
        setStats(prev => ({ ...prev, totalDemandes: demandes.length }));
        setRecentDemandes(
          [...demandes]
            .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
            .slice(0, 5)
        );
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        setStats(prev => ({ ...prev, totalIngenieurs: users.length }));
      }
    } catch (err) {
      console.error('Erreur dashboard admin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      setUserName(user.name || 'Administrateur');
    }
    fetchDashboardData();
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
            Tableau de bord, <span className="text-red-600">Admin</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenue, {userName} — Supervision globale du réseau SIG Ooredoo
          </p>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Cartes"
          value={stats.totalCartes}
          icon={<Layers size={20}/>}
          subtitle="Toutes cartes"
          delay={0.05}
          loading={loading}
          href="/dashboard_admin/cartes"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={<Clock size={20}/>}
          subtitle="À valider"
          delay={0.1}
          loading={loading}
          href="/dashboard_admin/cartes"
        />
        <StatCard
          title="Acceptées"
          value={stats.accepte}
          icon={<CheckCircle size={20}/>}
          subtitle="Approuvées"
          delay={0.15}
          loading={loading}
          href="/dashboard_admin/cartes"
        />
        <StatCard
          title="Publiées"
          value={stats.publie}
          icon={<Globe size={20}/>}
          subtitle="En ligne"
          delay={0.2}
          loading={loading}
          href="/dashboard_admin/cartes"
        />
        <StatCard
          title="Demandes"
          value={stats.totalDemandes}
          icon={<FileText size={20}/>}
          subtitle="Total reçues"
          delay={0.25}
          loading={loading}
          href="/dashboard_admin/demandes/liste"
        />
        <StatCard
          title="Ingénieurs"
          value={stats.totalIngenieurs}
          icon={<Users size={20}/>}
          subtitle="Comptes actifs"
          delay={0.3}
          loading={loading}
          href="/dashboard_admin/utilisateurs"
        />
      </section>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Cartes récentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-red-600 rounded-sm" /> Cartes récentes
            </h2>
            <Link href="/dashboard_admin/cartes" className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors border-b border-transparent hover:border-red-600 pb-0.5">
              Voir tout
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentCartes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentCartes.map((carte) => (
                  <div key={carte.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                        <Map size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{carte.nom}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="font-medium">{carte.user?.name || 'N/A'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{new Date(carte.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge statut={carte.statut} />
                      <Link href={`/dashboard_admin/cartes/${carte.id}`}>
                        <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:border-red-600 hover:text-red-600 transition-all shadow-sm">
                          <ChevronRight size={16} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-sm font-medium">Aucune carte enregistrée</div>
            )}
          </div>
        </section>

        {/* Demandes récentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-red-600 rounded-sm" /> Demandes récentes
            </h2>
            <Link href="/dashboard_admin/demandes/liste" className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors border-b border-transparent hover:border-red-600 pb-0.5">
              Voir tout
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentDemandes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentDemandes.map((demande) => (
                  <div key={demande.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-[11px] border border-red-100">
                        {demande.technologie}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{demande.nom}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="font-medium">{demande.ingenieur_nom || 'N/A'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{demande.service}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge statut={demande.statut} />
                      <Link href={`/dashboard_admin/demandes/${demande.id}`}>
                        <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:border-red-600 hover:text-red-600 transition-all shadow-sm">
                          <ChevronRight size={16} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-sm font-medium">Aucune demande émise</div>
            )}
          </div>
        </section>
      </div>

      {/* Action rapide */}
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
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Nouvelle Mission</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                Créer une <span className="text-red-600">demande de carte</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Assignez une nouvelle mission cartographique ou une zone d'étude radio à un ingénieur réseau et suivez son traitement en temps réel.
              </p>
            </div>
            
            <div className="w-full lg:w-auto">
              <Link
                href="/dashboard_admin/demandes"
                className="group inline-flex items-center justify-center gap-3 w-full lg:w-auto bg-red-600 text-white px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-red-700 shadow-sm active:scale-[0.99]"
              >
                <PlusCircle size={16} className="group-hover:rotate-95 transition-transform duration-300" />
                <span>Créer une demande</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}


