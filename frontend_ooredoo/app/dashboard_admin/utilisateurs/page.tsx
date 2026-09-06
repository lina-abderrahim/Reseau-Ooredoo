'use client';

import { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, X, Save, Inbox, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'ingenieur';
}

type FormState = { name: string; email: string; password: string; };

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/users?role=ingenieur');
      if (!response.ok) throw new Error();
      setUtilisateurs(await response.json());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setEditingId(null); setForm({ name: '', email: '', password: '' }); setShowForm(false); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nom et email obligatoires'); return; }
    if (!editingId && form.password.trim().length < 4) { toast.error('Mot de passe minimum 4 caractères'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(), email: form.email.trim(), role: 'ingenieur',
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };
      const response = await fetch(
        editingId ? `http://localhost:3000/users/${editingId}` : 'http://localhost:3000/users',
        { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!response.ok) throw new Error();
      toast.success(editingId ? 'Ingénieur modifié' : 'Ingénieur créé');
      resetForm();
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: UserAccount) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet ingénieur ?')) return;
    try {
      const response = await fetch(`http://localhost:3000/users/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast.success('Ingénieur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur de suppression');
    }
  };

  const filteredUsers = utilisateurs.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Chargement...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Gestion des ingénieurs</h1>
          <p className="text-gray-500 font-medium mt-1">
            <span className="text-[#ED1C24] font-bold">{filteredUsers.length}</span> ingénieur(s) trouvé(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ED1C24] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Rechercher un ingénieur..."
              className="pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-2xl w-64 outline-none focus:border-[#ED1C24] transition-all shadow-sm font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setEditingId(null); setForm({ name: '', email: '', password: '' }); setShowForm(true); }}
            className="bg-[#ED1C24] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-red-500/20"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {editingId ? "Modifier l'ingénieur" : 'Créer un ingénieur'}
            </h2>
            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom complet"
                className="p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email *</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.com" type="email"
                className="p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
              </label>
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Laisser vide pour ne pas modifier' : 'Minimum 4 caractères'}
                type="password"
                className="p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] font-bold text-gray-900 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rôle</label>
              <div className="p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg"><User size={14} className="text-blue-600" /></div>
                <span className="font-black text-blue-700 text-sm uppercase tracking-wider">Ingénieur</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={saving}
              className="px-8 py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-red-500/20">
              <Save size={16} />{saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button onClick={resetForm}
              className="px-8 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
              Annuler
            </button>
          </div>
        </motion.div>
      )}

      {/* Liste */}
      {filteredUsers.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Inbox className="text-gray-300" size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic mb-2">
            {searchTerm ? 'Aucun ingénieur trouvé' : 'Aucun ingénieur enregistré'}
          </h3>
          <p className="text-gray-400 font-medium">
            {searchTerm ? 'Essayez avec un autre terme.' : 'Cliquez sur "Ajouter" pour commencer.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map((user, index) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#ED1C24] rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 group-hover:text-[#ED1C24] transition-colors">{user.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100">
                      <User size={9}/> Ingénieur
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(user)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Modifier">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(user.id)}
                    className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Supprimer">
                    <Trash2 size={16} />
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


