'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Lock, Save, Eye, EyeOff, CheckCircle, Wifi, Radio, Plus, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const QUALITE_OPTIONS = [
  { label: 'Très bonne', value: 'bonne',    color: '#be1526' },
  { label: 'Bonne',      value: 'moyenne',  color: '#ff0921' },
  { label: 'Limitée',    value: 'mauvaise', color: '#d66064' },
];

export default function ParametresPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profil' | 'securite' | 'technologies'>('profil');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [name, setName] = useState('');
  const [confirmPasswordProfil, setConfirmPasswordProfil] = useState('');
  const [showConfirmProfil, setShowConfirmProfil] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [technologies, setTechnologies] = useState<{ id: number; nom_technologie: string }[]>([]);
  const [services, setServices] = useState<{ id: number; nom_service: string }[]>([]);
  const [newTech, setNewTech] = useState('');
  const [newService, setNewService] = useState('');
  const [techLoading, setTechLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) { router.push('/login'); return; }
    const user = JSON.parse(raw);
    setCurrentUser(user);
    setName(user.name || '');
  }, [router]);

  useEffect(() => {
    if (activeTab === 'technologies') {
      fetchTechnologies();
      fetchServices();
    }
  }, [activeTab]);

  const fetchTechnologies = async () => {
    try {
      const res = await fetch('http://localhost:3000/technologies');
      if (res.ok) setTechnologies(await res.json());
    } catch { toast.error('Erreur chargement technologies'); }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('http://localhost:3000/services');
      if (res.ok) setServices(await res.json());
    } catch { toast.error('Erreur chargement services'); }
  };

  const handleUpdateProfil = async () => {
    if (!name.trim()) { toast.error('Le nom est obligatoire'); return; }
    if (!confirmPasswordProfil.trim()) { toast.error('Veuillez confirmer votre mot de passe'); return; }
    setLoading(true);
    try {
      const verif = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, password: confirmPasswordProfil }),
      });
      if (!verif.ok) { toast.error('Mot de passe incorrect'); setLoading(false); return; }

      const response = await fetch(`http://localhost:3000/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const updated = { ...currentUser, name };
        localStorage.setItem('auth_user', JSON.stringify(updated));
        setCurrentUser(updated);
        setConfirmPasswordProfil('');
        toast.success('Nom mis à jour');
      } else { toast.error('Erreur de mise à jour'); }
    } catch { toast.error('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Tous les champs sont obligatoires'); return; }
    if (newPassword !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (newPassword.length < 6) { toast.error('Minimum 6 caractères'); return; }
    setLoading(true);
    try {
      const verif = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, password: currentPassword }),
      });
      if (!verif.ok) { toast.error('Mot de passe actuel incorrect'); setLoading(false); return; }

      const response = await fetch(`http://localhost:3000/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (response.ok) {
        toast.success('Mot de passe mis à jour');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else { toast.error('Erreur de mise à jour'); }
    } catch { toast.error('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const handleAddTech = async () => {
    if (!newTech.trim()) { toast.error('Nom obligatoire'); return; }
    setTechLoading(true);
    try {
      const res = await fetch('http://localhost:3000/technologies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_technologie: newTech.trim().toUpperCase() }),
      });
      if (res.ok) { toast.success('Technologie ajoutée'); setNewTech(''); fetchTechnologies(); }
      else toast.error('Technologie déjà existante');
    } catch { toast.error('Erreur de connexion'); }
    finally { setTechLoading(false); }
  };

  const handleDeleteTech = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/technologies/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Technologie supprimée'); fetchTechnologies(); }
      else toast.error('Erreur de suppression');
    } catch { toast.error('Erreur de connexion'); }
  };

  const handleAddService = async () => {
    if (!newService.trim()) { toast.error('Nom obligatoire'); return; }
    setServiceLoading(true);
    try {
      const res = await fetch('http://localhost:3000/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_service: newService.trim() }),
      });
      if (res.ok) { toast.success('Service ajouté'); setNewService(''); fetchServices(); }
      else toast.error('Service déjà existant');
    } catch { toast.error('Erreur de connexion'); }
    finally { setServiceLoading(false); }
  };

  const handleDeleteService = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/services/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Service supprimé'); fetchServices(); }
      else toast.error('Erreur de suppression');
    } catch { toast.error('Erreur de connexion'); }
  };

  const tabs = [
    { key: 'profil',       label: 'Profil',                  icon: <User size={16} /> },
    { key: 'securite',     label: 'Sécurité',                icon: <Lock size={16} /> },
    { key: 'technologies', label: 'Technologies & Services',  icon: <Wifi size={16} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Paramètres</h1>
        <p className="text-gray-500 font-medium mt-1">Gérez votre profil et les configurations de l'application</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? 'bg-[#ED1C24] text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PROFIL */}
      {activeTab === 'profil' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6"
        >
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#ED1C24] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/20">
              {name.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">{name}</p>
              <p className="text-xs text-gray-400 font-medium">{currentUser?.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all"
                placeholder="Votre nom"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Email <span className="text-gray-300 font-normal normal-case">(non modifiable)</span>
              </label>
              <div className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 text-gray-400 font-medium">
                {currentUser?.email}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Confirmer avec votre mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  type={showConfirmProfil ? 'text' : 'password'}
                  value={confirmPasswordProfil}
                  onChange={(e) => setConfirmPasswordProfil(e.target.value)}
                  className="w-full p-4 pr-12 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmProfil(!showConfirmProfil)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmProfil ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleUpdateProfil}
              disabled={loading}
              className="w-full py-4 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
            >
              <Save size={16} />
              {loading ? 'Enregistrement...' : 'Enregistrer le nom'}
            </button>
          </div>
        </motion.div>
      )}

      {/* SÉCURITÉ */}
      {activeTab === 'securite' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5"
        >
          <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Changer le mot de passe</h2>

          {[
            { label: 'Mot de passe actuel', value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(!showCurrent) },
            { label: 'Nouveau mot de passe', value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(!showNew), placeholder: 'Minimum 6 caractères' },
            { label: 'Confirmer le mot de passe', value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggleShow: () => setShowConfirm(!showConfirm) },
          ].map((field, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
              <div className="relative">
                <input
                  type={field.show ? 'text' : 'password'}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full p-4 pr-12 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all"
                  placeholder={(field as any).placeholder || '••••••••'}
                />
                <button type="button" onClick={field.toggleShow} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {field.show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          {confirmPassword && (
            <p className={`text-xs font-bold flex items-center gap-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
              {newPassword === confirmPassword
                ? <><CheckCircle size={12}/> Les mots de passe correspondent</>
                : 'Les mots de passe ne correspondent pas'
              }
            </p>
          )}

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full py-4 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
          >
            <Lock size={16} />
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </motion.div>
      )}

      {/* TECHNOLOGIES & SERVICES */}
      {activeTab === 'technologies' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Technologies */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-[#ED1C24]" />
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Technologies réseau</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                placeholder="Ex: 6G"
                className="flex-1 p-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 text-sm transition-all"
              />
              <button
                onClick={handleAddTech}
                disabled={techLoading}
                className="px-5 py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {technologies.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 font-medium">Aucune technologie</p>
              ) : technologies.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
                    <span className="font-black text-gray-900 text-sm uppercase">{tech.nom_technologie}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTech(tech.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-[#ED1C24]" />
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Services</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                placeholder="Ex: IoT"
                className="flex-1 p-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 text-sm transition-all"
              />
              <button
                onClick={handleAddService}
                disabled={serviceLoading}
                className="px-5 py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {services.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 font-medium">Aucun service</p>
              ) : services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
                    <span className="font-black text-gray-900 text-sm">{service.nom_service}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Qualités réseau */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Qualités réseau</h2>
            <div className="space-y-2">
              {QUALITE_OPTIONS.map((q) => (
                <div key={q.value} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: q.color }} />
                    <span className="font-black text-gray-900 text-sm">{q.label}</span>
                  </div>
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: q.color }}
                  >
                    {q.color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}