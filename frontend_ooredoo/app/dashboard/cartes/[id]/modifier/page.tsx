'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, FileUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

const QUALITE_OPTIONS = [
  { label: 'Très bonne', value: 'bonne',    color: '#be1526' },
  { label: 'Bonne',      value: 'moyenne',  color: '#ff0921' },
  { label: 'Limitée',    value: 'mauvaise', color: '#d66064' },
];

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-black uppercase text-xs tracking-widest">
      Initialisation de la carte...
    </div>
  )
});

export default function ModifierCartePage() {
  const router = useRouter();
  const { id } = useParams();

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const [formData, setFormData] = useState({ nom: '', qualite: 'bonne' });
  const [initialPolygons, setInitialPolygons] = useState<any[]>([]);
  // ✅ polygones = état actuel (modifiés + nouveaux)
  const [polygones, setPolygones] = useState<any[]>([]);
  const [carteId, setCarteId] = useState<number | undefined>(undefined);

  const [shpFile, setShpFile] = useState<File | null>(null);
  const [dbfFile, setDbfFile] = useState<File | null>(null);
  const [shxFile, setShxFile] = useState<File | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [excludeQualite, setExcludeQualite] = useState<string | undefined>(undefined);
  const [importCount, setImportCount] = useState(0);

  const qualiteAtImportRef = useRef<string>('bonne');

  const shpRef = useRef<HTMLInputElement>(null);
  const dbfRef = useRef<HTMLInputElement>(null);
  const shxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCarte = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(`http://localhost:3000/cartes-couverture/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData({
          nom: data.nom,
          qualite: data.polygones?.[0]?.qualite || 'bonne'
        });
        const polys = data.polygones || [];
        setInitialPolygons(polys);
        // ✅ Initialiser polygones avec les polygones existants
        setPolygones(polys);
        setCarteId(data.id);
      } catch {
        toast.error("Impossible de charger les données de la carte");
      } finally {
        setLoadingData(false);
      }
    };
    if (id) fetchCarte();
  }, [id]);

  const handleImportSHP = async () => {
    if (!shpFile || !dbfFile) return toast.error('Sélectionnez les fichiers .shp et .dbf');
    setImportLoading(true);
    const sessionId = `update-${id}-${Math.random().toString(36).substr(2, 5)}`;
    const body = new FormData();
    body.append('shp', shpFile);
    body.append('dbf', dbfFile);
    if (shxFile) body.append('shx', shxFile);
    body.append('qualite', formData.qualite);
    body.append('session_id', sessionId);

    qualiteAtImportRef.current = formData.qualite;

    try {
      const res = await fetch('http://localhost:3000/cartes-couverture/preview-shp-temp', { method: 'POST', body });
      if (res.ok) {
        setCurrentSessionId(sessionId);
        setExcludeQualite(formData.qualite);
        setImportCount(prev => prev + 1);
        toast.success("Aperçu chargé sur la carte");
      } else { throw new Error(); }
    } catch { toast.error("Erreur lors de l'importation"); }
    finally { setImportLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const body: any = {
        nom: formData.nom,
        // ✅ polygones = état actuel — modifiés + nouveaux + supprimés
        // Ne touche pas shp_layers (SHP importés) — géré séparément via session_id
        polygones: polygones,
      };

      // ✅ SHP importé — transférer shp_temp vers shp_layers
      if (currentSessionId) {
        body.session_id = currentSessionId;
        body.qualite = qualiteAtImportRef.current;
      }

      console.log('Body envoyé au backend:', body);

      const res = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Status réponse:', res.status);

      if (res.ok) {
        toast.success("Carte mise à jour");
        router.push('/dashboard/cartes');
      } else {
        const err = await res.json().catch(() => ({}));
        console.log('Erreur backend:', err);
        throw new Error();
      }
    } catch { toast.error("Erreur lors de la mise à jour"); }
    finally { setLoading(false); }
  };

  const currentQualite = QUALITE_OPTIONS.find(q => q.value === formData.qualite) || QUALITE_OPTIONS[0];

  if (loadingData) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-[#ED1C24]" size={40} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Chargement du projet...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-50 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cartes" className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group">
            <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">Modifier le Plan</h1>
            <p className="text-[10px] font-bold text-[#ED1C24] uppercase tracking-widest">ID : #{id}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden min-h-0">

        {/* Sidebar */}
        <aside className="w-96 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">

            {/* Nom */}
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nom du Plan</label>
              <input
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-sm focus:border-[#ED1C24] outline-none transition-all"
              />
            </div>

            {/* Qualité */}
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Qualité à remplacer</label>
              <div className="space-y-2">
                {QUALITE_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setFormData({...formData, qualite: q.value})}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                      formData.qualite === q.value
                        ? 'border-[#ED1C24] bg-red-50/50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-lg flex-shrink-0" style={{ backgroundColor: q.color }} />
                      <span className={`text-xs font-black uppercase ${formData.qualite === q.value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {q.label}
                      </span>
                    </div>
                    {formData.qualite === q.value && <div className="w-2 h-2 rounded-full bg-[#ED1C24]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Import SHP */}
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                Remplacer par un Shapefile
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => shpRef.current?.click()}
                  className={`w-full flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    shpFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-[#ED1C24] bg-gray-50'
                  }`}
                >
                  <FileUp size={16} className={shpFile ? 'text-emerald-600' : 'text-gray-400'} />
                  <span className="text-[10px] font-black uppercase truncate">{shpFile ? shpFile.name : 'Fichier .SHP *'}</span>
                  <input ref={shpRef} type="file" accept=".shp" className="hidden" onChange={(e) => setShpFile(e.target.files?.[0] || null)} />
                </button>

                <button
                  onClick={() => dbfRef.current?.click()}
                  className={`w-full flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    dbfFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-[#ED1C24] bg-gray-50'
                  }`}
                >
                  <FileUp size={16} className={dbfFile ? 'text-emerald-600' : 'text-gray-400'} />
                  <span className="text-[10px] font-black uppercase truncate">{dbfFile ? dbfFile.name : 'Fichier .DBF *'}</span>
                  <input ref={dbfRef} type="file" accept=".dbf" className="hidden" onChange={(e) => setDbfFile(e.target.files?.[0] || null)} />
                </button>

                <button
                  onClick={() => shxRef.current?.click()}
                  className={`w-full flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    shxFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <FileUp size={16} className={shxFile ? 'text-emerald-600' : 'text-gray-300'} />
                  <span className="text-[10px] font-black uppercase truncate text-gray-400">{shxFile ? shxFile.name : 'Fichier .SHX (optionnel)'}</span>
                  <input ref={shxRef} type="file" accept=".shx" className="hidden" onChange={(e) => setShxFile(e.target.files?.[0] || null)} />
                </button>

                <button
                  onClick={handleImportSHP}
                  disabled={importLoading || !shpFile || !dbfFile}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#ED1C24] disabled:opacity-30 transition-all"
                >
                  {importLoading ? 'Importation...' : "Charger l'aperçu"}
                </button>
              </div>

              {currentSessionId && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase">
                    Aperçu chargé — qualité {
                      QUALITE_OPTIONS.find(q => q.value === qualiteAtImportRef.current)?.label
                    } sera remplacée
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Carte */}
        <section className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-0">
          <MapComponent
            qualiteColor={currentQualite.color}
            qualite={formData.qualite}
            // ✅ Nouveau polygone dessiné — ajouter à la liste
            onSave={(newPolygon) => setPolygones(prev => [...prev, newPolygon])}
            // ✅ Polygones modifiés/supprimés — remplacer toute la liste
            onEdit={(updatedPolygons) => setPolygones(updatedPolygons)}
            initialPolygons={initialPolygons}
            carteId={carteId}
            sessionId={currentSessionId}
            excludeQualite={excludeQualite}
            importCount={importCount}
          />
        </section>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#ED1C24] hover:bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-red-500/20"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? 'Enregistrement...' : 'Confirmer les modifications'}
        </button>
      </div>
    </div>
  );
}