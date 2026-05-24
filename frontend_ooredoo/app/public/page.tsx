'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, Map, Wifi, Radio, Filter, X } from 'lucide-react';

interface Polygone {
  id: number;
  coordinates: string;
  qualite: string;
}

interface CarteCouverture {
  id: number;
  nom: string;
  statut: string;
  polygones: Polygone[];
  service_technologie: {
    id: number;
    technology?: { nom_technologie: string };
    service?: { nom_service: string };
  };
}

const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    '#be1526',
  moyenne:  '#ff0921',
  mauvaise: '#d66064',
};

const QUALITE_LABEL_MAP: Record<string, string> = {
  bonne:    'Très bonne',
  moyenne:  'Bonne',
  mauvaise: 'Limitée',
};

export default function PublicPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const polygonLayersRef = useRef<any[]>([]);
  const searchMarkerRef = useRef<any>(null);

  const [cartes, setCartes] = useState<CarteCouverture[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const services = ['Voix/SMS', 'Data'];

  const [selectedTech, setSelectedTech] = useState<string>('3G');
  const [selectedService, setSelectedService] = useState<string>('Voix/SMS');
  const [selectedQualites, setSelectedQualites] = useState<string[]>([]);
  // Cache GeoJSON pour eviter de recharger depuis le serveur a chaque filtre
  const geojsonCacheRef = useRef<Record<number, any>>({});
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cartesRes = await fetch('http://localhost:3000/cartes-couverture/publiques');
        if (cartesRes.ok) {
          const data: CarteCouverture[] = await cartesRes.json();
          setCartes(data.filter(c => c.statut === 'publie'));
        }
        const techRes = await fetch('http://localhost:3000/technologies');
        if (techRes.ok) {
          const techData = await techRes.json();
          setTechnologies(techData.map((t: any) => t.nom_technologie).filter(Boolean));
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      LRef.current = L;

      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        dragging: true, touchZoom: true, scrollWheelZoom: true,
        doubleClickZoom: true, boxZoom: true, keyboard: true,
        zoomSnap: 1, wheelPxPerZoomLevel: 60,
      }).setView([34.5, 9.5], 6);

      mapInstanceRef.current = map;

      const original = (map as any)._onZoomTransitionEnd;
      (map as any)._onZoomTransitionEnd = function (...args: any[]) {
        try { original.apply(this, args); } catch { }
      };

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const LegendControl = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create('div');
          div.style.cssText = `
            background: #111; padding: 10px 14px; border-radius: 12px;
            font-family: sans-serif; font-size: 11px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `;
          div.innerHTML = `
            <p style="font-weight:900;text-transform:uppercase;margin:0 0 8px;color:white;font-size:10px;letter-spacing:0.1em;">Qualité réseau</p>
            ${Object.entries(QUALITE_COLOR_MAP).map(([key, color]) => `
              <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
                <span style="width:12px;height:12px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
                <span style="color:#ccc;font-weight:700;font-size:11px;">${QUALITE_LABEL_MAP[key]}</span>
              </div>
            `).join('')}
          `;
          return div;
        }
      });
      new LegendControl({ position: 'bottomleft' }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
        map.dragging.enable();
        setMapReady(true);
      }, 300);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch { }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = undefined;
      }
      setMapReady(false);
    };
  }, []);

  // ✅ Affichage des polygones — manuels + SHP importés via GeoJSON
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapInstanceRef.current;

    // Supprimer les anciens layers
    polygonLayersRef.current.forEach(layer => {
      try { map.removeLayer(layer); } catch { }
    });
    polygonLayersRef.current = [];

    if (cartes.length === 0) return;

    const cartesFiltrees = cartes.filter(carte => {
      const tech = carte.service_technologie?.technology?.nom_technologie || '';
      const svc = carte.service_technologie?.service?.nom_service || '';
      if (selectedTech && tech !== selectedTech) return false;
      if (selectedService && svc !== selectedService) return false;
      return true;
    });

    if (cartesFiltrees.length === 0) return;

    const bounds: any[] = [];

    // ✅ Charger GeoJSON avec cache — filtrage local sans requête serveur à chaque filtre
    const qualitesSnapshot = [...selectedQualites];
    const loadAllCartes = async () => {
      for (const carte of cartesFiltrees) {
        try {
          // Utiliser le cache si disponible
          let geojson = geojsonCacheRef.current[carte.id];
          if (!geojson) {
            const res = await fetch(`http://localhost:3000/tiles/${carte.id}/geojson`);
            if (!res.ok) continue;
            geojson = await res.json();
            geojsonCacheRef.current[carte.id] = geojson; // Mettre en cache
          }

          if (!geojson?.features?.length) continue;

          const layer = L.geoJSON(geojson, {
            filter: (feature: any) => {
              if (qualitesSnapshot.length === 0) return true;
              return qualitesSnapshot.includes(feature?.properties?.qualite);
            },
            style: (feature: any) => {
              const q = (feature?.properties?.qualite || '').toLowerCase().trim();
              const color = QUALITE_COLOR_MAP[q] || '#6b7280';
              return { color, fillColor: color, fillOpacity: 0.35, weight: 2 };
            },
            onEachFeature: (feature: any, layer: any) => {
              const q = feature?.properties?.qualite || '';
              const color = QUALITE_COLOR_MAP[q] || '#6b7280';
              layer.bindPopup(`
                <div style="font-family:sans-serif;font-size:12px;min-width:160px;color:#1e293b;">
                  <p style="font-weight:900;margin:0 0 8px;color:#111;text-transform:uppercase;font-size:11px;">${carte.nom}</p>
                  <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span>Qualité : <strong>${QUALITE_LABEL_MAP[q] || q}</strong></span>
                  </div>
                  <p style="margin:3px 0;color:#6b7280;font-size:11px;">Technologie : <strong style="color:#111;">${carte.service_technologie?.technology?.nom_technologie || 'N/A'}</strong></p>
                  <p style="margin:3px 0;color:#6b7280;font-size:11px;">Service : <strong style="color:#111;">${carte.service_technologie?.service?.nom_service || 'N/A'}</strong></p>
                </div>
              `, { maxWidth: 220 });
            }
          }).addTo(map);

          polygonLayersRef.current.push(layer);

          try {
            const layerBounds = layer.getBounds();
            if (layerBounds.isValid()) bounds.push(layerBounds);
          } catch { }

        } catch (e) {
          console.error(`Erreur chargement carte ${carte.id}:`, e);
        }
      }

      if (bounds.length > 0) {
        try { map.fitBounds(bounds, { padding: [30, 30] }); } catch { }
      }
    };

    loadAllCartes();

  }, [cartes, selectedTech, selectedService, selectedQualites, mapReady]);

  const toggleQualite = (qualite: string) => {
    setSelectedQualites(prev =>
      prev.includes(qualite) ? prev.filter(q => q !== qualite) : [...prev, qualite]
    );
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim() || !mapInstanceRef.current || !LRef.current) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress + ', Tunisie')}&format=json&limit=1&countrycodes=tn`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        mapInstanceRef.current.setView([parseFloat(lat), parseFloat(lon)], 12);
        const L = LRef.current;
        if (searchMarkerRef.current) {
          try { mapInstanceRef.current.removeLayer(searchMarkerRef.current); } catch { }
          searchMarkerRef.current = null;
        }
        const locationIcon = L.divIcon({
          className: '',
          html: `<div style="background:#ED1C24;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(237,28,36,0.2);border:2px solid white;"></div>`,
          iconAnchor: [12, 12], iconSize: [24, 24],
        });
        searchMarkerRef.current = L.marker([parseFloat(lat), parseFloat(lon)], { icon: locationIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div style="font-family:sans-serif;font-size:12px;font-weight:700;color:#111;">${searchAddress}</div>`)
          .openPopup();
      } else {
        alert('Adresse non trouvée en Tunisie');
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const resetFiltres = () => {
    setSelectedTech('3G');
    setSelectedService('Voix/SMS');
    setSelectedQualites([]);
    setSearchAddress('');
    if (searchMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(searchMarkerRef.current); } catch { }
      searchMarkerRef.current = null;
    }
    if (mapInstanceRef.current) mapInstanceRef.current.setView([34.5, 9.5], 6);
  };

  const hasFiltres = selectedTech !== '3G' || selectedService !== 'Voix/SMS' || selectedQualites.length > 0 || searchAddress;

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 h-[64px] flex items-center shrink-0 shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <Image src="/logo_2.png" alt="Ooredoo" width={110} height={36} style={{ width: '110px', height: 'auto' }} priority />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col justify-between h-full overflow-y-auto shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Filtres Réseau</h1>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed font-medium">Consultez la cartographie en temps réel des infrastructures mobiles.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block">Localiser une adresse</label>
              <div className="flex gap-1.5">
                <input type="text" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                  placeholder="Ex: Avenue Bourguiba, Tunis"
                  className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-[#ED1C24] text-xs font-bold text-gray-800 transition-all bg-gray-50/50" />
                <button onClick={handleSearchAddress} disabled={searchLoading}
                  className="p-2.5 bg-[#ED1C24] text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                  {searchLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block flex items-center gap-1.5">
                <Wifi size={11} /> Génération Mobile
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(technologies.length > 0 ? technologies : ['2G', '3G', '4G', '5G']).map(tech => (
                  <button key={tech} onClick={() => setSelectedTech(tech)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                      selectedTech === tech ? 'bg-[#ED1C24] text-white border-[#ED1C24] shadow-md shadow-red-500/20' : 'bg-white text-gray-600 border-gray-100 hover:border-[#ED1C24] hover:text-[#ED1C24]'}`}>
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block flex items-center gap-1.5">
                <Radio size={11} /> Service Supporté
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {services.map(svc => (
                  <button key={svc} onClick={() => setSelectedService(svc)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                      selectedService === svc ? 'bg-[#ED1C24] text-white border-[#ED1C24] shadow-md shadow-red-500/20' : 'bg-white text-gray-600 border-gray-100 hover:border-[#ED1C24] hover:text-[#ED1C24]'}`}>
                    {svc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block flex items-center gap-1.5">
                <Filter size={11} /> Niveaux de Signal
              </label>
              <div className="space-y-1.5">
                {Object.entries(QUALITE_LABEL_MAP).map(([key, label]) => {
                  const isSelected = selectedQualites.includes(key);
                  const color = QUALITE_COLOR_MAP[key];
                  return (
                    <button key={key} onClick={() => toggleQualite(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-black transition-all ${
                        isSelected ? 'border-[#ED1C24] bg-red-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                      <div className={`w-4 h-4 rounded-lg flex items-center justify-center shrink-0 border-2 ${isSelected ? 'bg-[#ED1C24] border-[#ED1C24]' : 'border-gray-200 bg-white'}`}>
                        {isSelected && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                      <span className="flex-1 text-left text-gray-700 uppercase tracking-wider text-[10px]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasFiltres && (
              <button onClick={resetFiltres}
                className="w-full py-2.5 bg-white border-2 border-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-[#ED1C24] hover:text-[#ED1C24] transition-all flex items-center justify-center gap-2">
                <X size={12} /> Réinitialiser les filtres
              </button>
            )}
          </div>

          <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-black text-gray-900">{cartes.length}</p>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Cartes SIG</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-black text-gray-900">{cartes.reduce((acc, c) => acc + (c.polygones?.length || 0), 0)}</p>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Polygones</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-gray-50">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {cartes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-[500] bg-white/60 backdrop-blur-sm pointer-events-none">
              <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4 pointer-events-auto">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Map size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-900 font-black text-sm uppercase tracking-widest mb-1">Aucun réseau publié</p>
                <p className="text-gray-400 text-xs font-medium leading-relaxed">Les zones de couverture s'afficheront après validation par l'administration.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}