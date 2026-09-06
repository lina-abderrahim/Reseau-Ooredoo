'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Signal, ArrowLeft, Save, FileUp, Info, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const QUALITE_OPTIONS = [
  { label: 'Très bonne', value: 'bonne',    color: '#ED1C24' },
  { label: 'Bonne',      value: 'moyenne',  color: '#FF4D52' },
  { label: 'Limitée',    value: 'mauvaise', color: '#FF8084' },
];

interface PolygonData { coordinates: any; qualite: string; }
interface ShpImportData { fileName: string; qualite: string; count: number; }

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#ED1C24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Chargement de la carte GIS...</p>
      </div>
    </div>
  )
});

export default function CreerCartePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDemande = searchParams?.get('from') === 'demande';

 const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`);

  const [formData, setFormData] = useState({
    nom_carte: '', description: '', technologie: '', service: '', qualite: 'bonne',
  });

  const [drawnPolygons, setDrawnPolygons] = useState<PolygonData[]>([]);
  const [shpImports, setShpImports] = useState<ShpImportData[]>([]);
  const [importCount, setImportCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [demandeOrigineId, setDemandeOrigineId] = useState<number | string | null>(null);

  const shpRef = useRef<HTMLInputElement>(null);
  const dbfRef = useRef<HTMLInputElement>(null);
  const shxRef = useRef<HTMLInputElement>(null);
  const [shpFile, setShpFile] = useState<File | null>(null);
  const [dbfFile, setDbfFile] = useState<File | null>(null);
  const [shxFile, setShxFile] = useState<File | null>(null);

  const [technologies, setTechnologies] = useState<{ id: number; nom_technologie: string }[]>([]);
  const [services, setServices] = useState<{ id: number; nom_service: string }[]>([]);
  const [serviceTechs, setServiceTechs] = useState<any[]>([]);

  // 1. Chargement des référentiels API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTech, resServ, resST] = await Promise.all([
          fetch('http://localhost:3000/technologies'),
          fetch('http://localhost:3000/services'),
          fetch('http://localhost:3000/service-technologies')
        ]);

        const techData = resTech.ok ? await resTech.json() : [];
        const servData = resServ.ok ? await resServ.json() : [];
        const stData = resST.ok ? await resST.json() : [];

        setTechnologies(techData);
        setServices(servData);
        setServiceTechs(stData);

        // ✅ Initialiser avec 2G et Voix/SMS par défaut
        setFormData(prev => ({
          ...prev,
          technologie: prev.technologie ||
            techData.find((t: any) => t.nom_technologie === '2G')?.nom_technologie ||
            techData[0]?.nom_technologie || '',
          service: prev.service ||
            servData.find((s: any) => s.nom_service === 'Voix/SMS')?.nom_service ||
            servData[0]?.nom_service || '',
        }));

      } catch {
        toast.error("Erreur de récupération des configurations réseaux");
      }
    };
    fetchData();
  }, []);

  // 2. Récupération de l'utilisateur + données de la demande
  useEffect(() => {
    const user = sessionStorage.getItem('auth_user');
    if (user) {
      setCurrentUserId(JSON.parse(user).id);
    } else {
      router.push('/login');
      return;
    }

    if (fromDemande) {
      const savedDemande = sessionStorage.getItem('carte_from_demande');
      if (savedDemande) {
        try {
          const data = JSON.parse(savedDemande);
          setFormData(prev => ({
            ...prev,
            nom_carte: data.nom || '',
            description: data.description || '',
            technologie: data.technologie || prev.technologie,
            service: data.service || prev.service,
            qualite: data.qualites?.[0] || 'bonne',
          }));
          if (data.polygones && data.polygones.length > 0) {
            setDrawnPolygons(data.polygones);
          }
          if (data.demande_id) {
            setDemandeOrigineId(data.demande_id);
          }
          toast.success("Données de la demande injectées avec succès !");
        } catch (e) {
          console.error("Erreur parsing carte_from_demande", e);
        }
      }
    }

    return () => {
      if (importCount > 0) {
        fetch(`http://localhost:3000/cartes-couverture/temp/${sessionId}`, { method: 'DELETE' }).catch(() => {});
      }
    };
  }, [router, sessionId, importCount, fromDemande]);

  // Nettoyage du sessionStorage après initialisation
  useEffect(() => {
    if (formData.nom_carte && fromDemande) {
      sessionStorage.removeItem('carte_from_demande');
    }
  }, [formData.nom_carte, fromDemande]);

  const handleImportSHP = async () => {
    if (!shpFile || !dbfFile) return toast.error('Sélectionnez au minimum les fichiers .shp et .dbf');
    setImportLoading(true);
    const body = new FormData();
    body.append('shp', shpFile);
    body.append('dbf', dbfFile);
    if (shxFile) body.append('shx', shxFile);
    body.append('qualite', formData.qualite);
    body.append('session_id', sessionId);

    try {
      const res = await fetch('http://localhost:3000/cartes-couverture/preview-shp-temp', { method: 'POST', body });
      if (res.ok) {
        const data = await res.json();
        setShpImports(prev => [...prev, { fileName: shpFile.name, qualite: formData.qualite, count: data.count }]);
        setImportCount(prev => prev + 1);
        setShpFile(null);
        setDbfFile(null);
        setShxFile(null);
        toast.success("Données géographiques importées temporairement");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Échec de l'importation du Shapefile");
      }
    } catch {
      toast.error("Échec de connexion réseau lors de l'import");
    } finally {
      setImportLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nom_carte.trim()) return toast.error("Le nom du plan est obligatoire");

    if (drawnPolygons.length === 0 && shpImports.length === 0) {
      return toast.error("Veuillez dessiner au moins une zone ou importer un fichier Shapefile");
    }

    // ✅ Recherche souple de la combinaison technologie/service
    const foundST = serviceTechs.find(st => {
      const techName = (st.technology?.nom_technologie || st.nom_technologie || '').trim().toLowerCase();
      const servName = (st.service?.nom_service || st.nom_service || '').trim().toLowerCase();
      return techName === formData.technologie.trim().toLowerCase() &&
             servName === formData.service.trim().toLowerCase();
    });

    // ✅ Si combinaison non trouvée on enregistre quand même sans service_technologie_id
    const serviceTechId = foundST?.id || null;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/cartes-couverture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom_carte,
          description: formData.description,
          statut: 'en_attente',
          user_id: currentUserId,
          service_technologie_id: serviceTechId,
          polygones: drawnPolygons,
          session_id: sessionId,
          demande_origine_id: demandeOrigineId,
        }),
      });
      if (res.ok) {
        toast.success("Plan de couverture réseau enregistré avec succès !");
        router.push('/dashboard/cartes');
      } else {
        toast.error("Erreur lors de la sauvegarde du plan");
      }
    } catch {
      toast.error("Erreur de connexion avec le serveur central");
    } finally {
      setLoading(false);
    }
  };

  const currentQualite = QUALITE_OPTIONS.find(q => q.value === formData.qualite) || QUALITE_OPTIONS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] font-sans text-gray-900 bg-white px-4">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-5 flex-shrink-0 pt-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cartes" className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
            <ArrowLeft size={18} className="text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-950 italic uppercase tracking-tight flex items-center gap-2">
              Éditeur de couverture
            </h1>
            <p className="text-[10px] font-black text-[#ED1C24] uppercase tracking-widest mt-0.5">
              {fromDemande ? `Traitement de la demande #${demandeOrigineId}` : ''}
            </p>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex gap-6 flex-1 overflow-hidden min-h-0 pb-4">
        {/* SIDEBAR */}
        <aside className="w-[380px] flex-shrink-0 bg-gray-50/60 border border-gray-100 rounded-[2rem] overflow-y-auto p-6 space-y-6">

          {fromDemande && (
            <div className="p-3.5 bg-neutral-950 border border-neutral-900 rounded-2xl text-white flex items-start gap-3 shadow-sm">
              <Info size={16} className="text-[#ED1C24] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-medium leading-relaxed">
                Formulaire pré-rempli d'après les directives de l'administrateur. Ajustez les tracés sur la carte.
              </p>
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Signal size={15} className="text-[#ED1C24]" />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Spécifications Générales</h2>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 pl-0.5">Nom du Plan *</label>
              <input
                type="text"
                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ED1C24] font-semibold text-sm transition-all"
                placeholder="Ex: Couverture Tunis Centre"
                value={formData.nom_carte}
                onChange={(e) => setFormData({...formData, nom_carte: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 pl-0.5">Description</label>
              <textarea
                rows={2}
                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ED1C24] text-xs font-medium transition-all resize-none italic"
                placeholder="Notes et contraintes d'infrastructure..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 pl-0.5">Technologie</label>
                <select
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#ED1C24] transition-all"
                  value={formData.technologie}
                  onChange={(e) => setFormData({...formData, technologie: e.target.value})}
                >
                  {technologies.map(t => (
                    <option key={t.id} value={t.nom_technologie}>{t.nom_technologie}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 pl-0.5">Service</label>
                <select
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#ED1C24] transition-all"
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.nom_service}>{s.nom_service}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200/60" />

          <section className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-400 pl-0.5 block">Qualité du Signal à dessiner / importer</label>
            <div className="grid grid-cols-1 gap-2">
              {QUALITE_OPTIONS.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setFormData({...formData, qualite: q.value})}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    formData.qualite === q.value
                      ? 'border-neutral-950 bg-white shadow-sm ring-2 ring-neutral-950/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: q.color }} />
                    <span className={`text-xs font-black uppercase tracking-wider ${formData.qualite === q.value ? 'text-gray-950' : 'text-gray-400'}`}>
                      {q.label}
                    </span>
                  </div>
                  {formData.qualite === q.value && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                </button>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-200/60" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Layers size={14} />
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest">Importation SIG (.SHP)</h2>
                <p className="text-[8px] text-gray-400 font-bold mt-0.5">Associez vos fichiers vectoriels d'antennes</p>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => shpRef.current?.click()}
                className={`w-full flex items-center gap-3 p-3 border border-dashed rounded-xl transition-all ${shpFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-[#ED1C24] bg-white'}`}>
                <FileUp size={15} className={shpFile ? 'text-emerald-600' : 'text-gray-400'} />
                <span className="text-[11px] font-bold truncate text-gray-600">{shpFile ? shpFile.name : 'Fichier principal .shp *'}</span>
                <input ref={shpRef} type="file" accept=".shp" className="hidden" onChange={(e) => setShpFile(e.target.files?.[0] || null)} />
              </button>

              <button onClick={() => dbfRef.current?.click()}
                className={`w-full flex items-center gap-3 p-3 border border-dashed rounded-xl transition-all ${dbfFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-[#ED1C24] bg-white'}`}>
                <FileUp size={15} className={dbfFile ? 'text-emerald-600' : 'text-gray-400'} />
                <span className="text-[11px] font-bold truncate text-gray-600">{dbfFile ? dbfFile.name : "Fichier d'attributs .dbf *"}</span>
                <input ref={dbfRef} type="file" accept=".dbf" className="hidden" onChange={(e) => setDbfFile(e.target.files?.[0] || null)} />
              </button>

              <button onClick={() => shxRef.current?.click()}
                className={`w-full flex items-center gap-3 p-3 border border-dashed rounded-xl transition-all ${shxFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <FileUp size={15} className={shxFile ? 'text-emerald-600' : 'text-gray-300'} />
                <span className="text-[11px] font-bold truncate text-gray-400">{shxFile ? shxFile.name : 'Index de géométrie .shx (optionnel)'}</span>
                <input ref={shxRef} type="file" accept=".shx" className="hidden" onChange={(e) => setShxFile(e.target.files?.[0] || null)} />
              </button>

              <button onClick={handleImportSHP} disabled={importLoading || !shpFile || !dbfFile}
                className="w-full py-3 bg-neutral-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#ED1C24] disabled:opacity-30 transition-all shadow-sm">
                {importLoading ? 'Conversion géospatiale...' : 'Injecter sur la carte'}
              </button>
            </div>

            {shpImports.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {shpImports.map((imp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 truncate max-w-[180px]">{imp.fileName}</span>
                    <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-md uppercase">{imp.count} polygones</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        {/* CARTE */}
        <main className="flex-1 bg-white border border-gray-100 rounded-[2rem] overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <MapComponent
            qualiteColor={currentQualite.color}
            qualite={formData.qualite}
            onSave={(newPoly) => setDrawnPolygons(prev => [...prev, newPoly])}
            initialPolygons={drawnPolygons}
            sessionId={importCount > 0 ? sessionId : undefined}
            importCount={importCount}
          />
        </main>
      </div>

      {/* FOOTER */}
      {(drawnPolygons.length > 0 || shpImports.length > 0) && (
        <footer className="mt-2 py-3 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <button onClick={handleSave} disabled={loading}
            className="px-10 py-4 bg-[#ED1C24] hover:bg-neutral-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2.5 shadow-lg shadow-red-500/10 disabled:opacity-50">
            {loading ? 'Enregistrement du plan...' : <><Save size={16} /> Enregistrer la couverture réseau</>}
          </button>
        </footer>
      )}
    </div>
  );
}


