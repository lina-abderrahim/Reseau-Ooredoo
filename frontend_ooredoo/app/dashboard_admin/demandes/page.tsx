'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Mail, Layers, Cpu, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const QUALITE_OPTIONS = [
  { label: 'Très bonne', value: 'bonne', color: '#be1526' },
  { label: 'Bonne', value: 'moyenne', color: '#ff0921' },
  { label: 'Limitée', value: 'mauvaise', color: '#d66064' },
];

interface Ingenieur {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Carte {
  id: number;
  nom: string;
  qualites: string[];
}

export default function DemandesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  
  const [ingenieurs, setIngenieurs] = useState<Ingenieur[]>([]);
  const [technologies, setTechnologies] = useState<{ id: number; nom_technologie: string }[]>([]);
  const [services, setServices] = useState<{ id: number; nom_service: string }[]>([]);
  
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [selectedIngenieur, setSelectedIngenieur] = useState<Ingenieur | null>(null);
  const [formData, setFormData] = useState({ description: '', technologie: '', service: '' });
  const [cartes, setCartes] = useState<Carte[]>([{ id: Date.now(), nom: '', qualites: [] }]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resUsers, resTech, resServ] = await Promise.all([
          fetch('http://localhost:3000/users'),
          fetch('http://localhost:3000/technologies'),
          fetch('http://localhost:3000/services')
        ]);

        if (!resUsers.ok || !resTech.ok || !resServ.ok) throw new Error();

        const usersData = await resUsers.json();
        const techData = await resTech.json();
        const servData = await resServ.json();

        setIngenieurs(usersData.filter((u: any) => u.role === 'ingenieur'));
        setTechnologies(techData);
        setServices(servData);

        setFormData({
          description: '',
          technologie: techData[0]?.nom_technologie || '',
          service: servData[0]?.nom_service || '',
        });

      } catch (error) {
        toast.error('Erreur lors du chargement des données de configuration');
      } finally {
        setLoadingInit(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleIngenieurChange = (email: string) => {
    setSelectedEmail(email);
    setSelectedIngenieur(ingenieurs.find(i => i.email === email) || null);
  };

  const addCarte = () => setCartes([...cartes, { id: Date.now(), nom: '', qualites: [] }]);

  const removeCarte = (id: number) => {
    if (cartes.length === 1) { 
      toast.error('Il faut au moins inclure une carte dans la demande'); 
      return; 
    }
    setCartes(cartes.filter(c => c.id !== id));
  };

  const updateCarteNom = (id: number, nom: string) =>
    setCartes(cartes.map(c => c.id === id ? { ...c, nom } : c));

  const toggleQualite = (carteId: number, qualite: string) =>
    setCartes(cartes.map(c => {
      if (c.id !== carteId) return c;
      const qualites = c.qualites.includes(qualite)
        ? c.qualites.filter(q => q !== qualite)
        : [...c.qualites, qualite];
      return { ...c, qualites };
    }));

  const handleSave = async () => {
    if (!selectedIngenieur) { toast.error('Veuillez sélectionner un ingénieur'); return; }
    if (!formData.technologie || !formData.service) { toast.error('Technologie ou service manquant'); return; }
    
    for (const carte of cartes) {
      if (!carte.nom.trim()) { toast.error('Nom manquant pour une des cartes'); return; }
      if (carte.qualites.length === 0) { toast.error(`Sélectionnez au moins une qualité pour "${carte.nom}"`); return; }
    }

    setLoading(true);
    try {
      const responses = await Promise.all(cartes.map(carte =>
        fetch('http://localhost:3000/demandes-cartes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: carte.nom,
            description: formData.description || '',
            technologie: formData.technologie,
            service: formData.service,
            qualites: carte.qualites,
            polygones: [],
            ingenieur_id: selectedIngenieur.id,
            ingenieur_nom: selectedIngenieur.name,
            ingenieur_email: selectedIngenieur.email,
            createdAt: new Date().toISOString(),
            statut: 'En attente'
          }),
        })
      ));

      const allOk = responses.every(res => res.ok);

      if (allOk) {
        toast.success(`${cartes.length} demande(s) affectée(s) avec succès à ${selectedIngenieur.name}`);
        router.push('/dashboard_admin/demandes/liste');
      } else {
        toast.error("Une ou plusieurs demandes n'ont pas pu être enregistrées.");
      }
    } catch {
      toast.error('Erreur réseau. Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initialisation du formulaire...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4 transition-all duration-300">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard_admin')}
          className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group"
        >
          <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Demander une carte</h1>
          <p className="text-gray-500 font-medium mt-1">Planifiez et assignez des périmètres de couverture réseau</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* Section 1 : Sélection ingénieur */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ingénieur responsable</h2>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-[#ED1C24]" />
              <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Sélectionner l'ingénieur destinataire *</label>
            </div>
            <select
              className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] bg-white text-gray-800 font-bold text-sm transition-all shadow-inner focus:scale-[1.005]"
              value={selectedEmail}
              onChange={(e) => handleIngenieurChange(e.target.value)}
            >
              <option value="">-- Aucun ingénieur sélectionné --</option>
              {ingenieurs.map((ing) => (
                <option key={ing.id} value={ing.email}>
                  {ing.name} ({ing.email})
                </option>
              ))}
            </select>

            <AnimatePresence>
              {selectedIngenieur && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 overflow-hidden"
                >
                  <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">{selectedIngenieur.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">Ingénieur validé et assigné au projet</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section 2 : Configuration technique */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Configuration technique globale</h2>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-gray-400" />
              <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Description / Consignes particulières</label>
            </div>
            <textarea
              rows={3}
              className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] bg-white text-gray-800 font-medium resize-none text-sm transition-all focus:scale-[1.005]"
              placeholder="Ajoutez des détails ou instructions pour l'ingénieur (optionnel)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={14} className="text-gray-400" />
                <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Technologie Réseau *</label>
              </div>
              <select
                className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] bg-white text-gray-800 font-bold text-sm transition-all"
                value={formData.technologie}
                onChange={(e) => setFormData({ ...formData, technologie: e.target.value })}
              >
                {technologies.length === 0 ? (
                  <option value="">Aucune technologie disponible</option>
                ) : (
                  technologies.map(tech => (
                    <option key={tech.id} value={tech.nom_technologie}>{tech.nom_technologie}</option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={14} className="text-gray-400" />
                <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Type de Service *</label>
              </div>
              <select
                className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#ED1C24] bg-white text-gray-800 font-bold text-sm transition-all"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              >
                {services.length === 0 ? (
                  <option value="">Aucun service disponible</option>
                ) : (
                  services.map(serv => (
                    <option key={serv.id} value={serv.nom_service}>{serv.nom_service}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 : Cartes */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Livrables cartographiques</h2>
            <span className="px-3 py-1 bg-red-50 text-[#ED1C24] border border-red-100 rounded-full text-xs font-black uppercase tracking-wider">
              Total : {cartes.length} Carte{cartes.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {cartes.map((carte, index) => (
                <motion.div
                  key={carte.id}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="border-2 border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-4 relative group"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-[#ED1C24] uppercase tracking-widest">Carte #{index + 1}</p>
                    {cartes.length > 1 && (
                      <button 
                        onClick={() => removeCarte(carte.id)} 
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2 block">Nom de la carte *</label>
                    <input
                      type="text"
                      placeholder="Ex: Zone Grand Tunis"
                      className="w-full p-3.5 border-2 border-gray-100 rounded-xl outline-none focus:border-[#ED1C24] bg-white text-gray-800 font-bold text-sm transition-all"
                      value={carte.nom}
                      onChange={(e) => updateCarteNom(carte.id, e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-3 block">
                      Seuils de Qualité requis * (Sélection multiple)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {QUALITE_OPTIONS.map((q) => {
                        const isSelected = carte.qualites.includes(q.value);
                        return (
                          <button
                            key={q.value}
                            type="button"
                            onClick={() => toggleQualite(carte.id, q.value)}
                            className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 transform hover:scale-[1.02]"
                            style={{
                              backgroundColor: isSelected ? q.color : '#ffffff',
                              color: isSelected ? 'white' : '#4b5563',
                              border: `2px solid ${isSelected ? q.color : '#f3f4f6'}`,
                              boxShadow: isSelected ? `0 4px 12px ${q.color}30` : 'none'
                            }}
                          >
                            {q.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={addCarte}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:border-[#ED1C24] hover:text-[#ED1C24] hover:bg-red-50/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" /> Ajouter une carte
            </button>
          </div>
        </div>

        {/* Actions finales */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#ED1C24] hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-red-500/10 active:scale-95"
          >
            <Save size={18} />
            {loading ? 'Création et routage...' : 'Envoyer à l\'ingénieur'}
          </button>
        </div>
      </div>
    </div>
  );
}


