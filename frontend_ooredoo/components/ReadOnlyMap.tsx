'use client';

import { useEffect, useRef, useState } from 'react';

type ReadOnlyMapProps = {
  polygons?: any[];
  commentaire_refus?: string;
  type_commentaire?: string;
  carteId?: number;
};

const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    "#be1526",
  moyenne:  "#ff0921",
  mauvaise: "#d66064",
};

export default function ReadOnlyMap({ carteId, commentaire_refus, type_commentaire }: ReadOnlyMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (instanceRef.current) {
      try { instanceRef.current.remove(); } catch { }
      instanceRef.current = null;
    }

    if (!mapRef.current) return;

    let isMounted = true;
    let map: any = null;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapRef.current) return;

        map = L.map(mapRef.current).setView([34.5, 9.5], 7);
        instanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        if (carteId) {
          const res = await fetch(`http://localhost:3000/tiles/${carteId}/geojson`);
          const geojsonData = await res.json();

          if (geojsonData?.features?.length && isMounted) {
            const geojsonLayer = L.geoJSON(geojsonData, {
              style: (feature: any) => {
                const q = (feature?.properties?.qualite || '').toLowerCase().trim();
                const color = QUALITE_COLOR_MAP[q] || '#be1526';
                return { fillColor: color, fillOpacity: 0.4, color, weight: 1.5 };
              }
            }).addTo(map);
            map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
          }
        }

        if (type_commentaire === 'note' && commentaire_refus) {
          try {
            const notes = JSON.parse(commentaire_refus) as { lat: number; lng: number; texte: string }[];
            notes.forEach((note, idx) => {
              const noteIcon = L.divIcon({
                className: 'custom-note-icon',
                html: `<div style="background:#1e293b;color:white;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;border:2px solid white;">📝</div>`,
                iconAnchor: [15, 30],
                iconSize: [30, 30],
              });
              L.marker([note.lat, note.lng], { icon: noteIcon })
                .addTo(map)
                .bindPopup(`<div><strong>Note ${idx + 1}</strong><br/>${note.texte}</div>`);
            });
          } catch { }
        }

        setTimeout(() => { map.invalidateSize(); }, 200);

      } catch (error) {
        console.error(error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (instanceRef.current) {
        try { instanceRef.current.remove(); } catch { }
        instanceRef.current = null;
      }
    };
  }, [carteId, commentaire_refus, type_commentaire]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setShowResults(false);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=tn`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch { } finally { setSearchLoading(false); }
  };

  const handleSelectResult = async (result: any) => {
    const map = instanceRef.current;
    if (!map) return;
    const L = (await import('leaflet')).default;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.setView([lat, lng], 13);
    if (markerRef.current) map.removeLayer(markerRef.current);
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<strong>${result.display_name.split(',')[0]}</strong>`).openPopup();
    markerRef.current = marker;
    setShowResults(false);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  return (
    <div className="relative w-full h-full">
      {/* Barre de recherche */}
      <div style={{
        position: 'absolute', top: 12,
        left: '50%', transform: 'translateX(-50%)',
        width: '70%', maxWidth: '480px',
        zIndex: 1000,
      }}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher une adresse en Tunisie..."
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 shadow-lg outline-none focus:border-[#ED1C24] text-sm font-medium bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="px-4 py-2.5 bg-[#ED1C24] text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 shadow-lg"
          >
            {searchLoading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Chercher'
            }
          </button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {searchResults.map((result, idx) => (
              <button key={idx} onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                <p className="text-sm font-bold text-gray-900 truncate">{result.display_name.split(',')[0]}</p>
                <p className="text-xs text-gray-400 truncate">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && (
          <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-3 text-center">
            <p className="text-sm text-gray-500 font-medium">Aucun résultat trouvé</p>
          </div>
        )}
      </div>

      {/* Carte */}
      <div ref={mapRef} className="w-full h-full min-h-[420px] rounded-2xl border border-gray-200" />
    </div>
  );
}
