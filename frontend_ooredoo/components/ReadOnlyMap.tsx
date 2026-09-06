'use client';

import { useEffect, useRef, useState } from 'react';

type NoteOnMap = {
  id: string;
  lat: number;
  lng: number;
  texte: string;
};

type ReadOnlyMapProps = {
  polygons?: { coordinates: string; qualite: string }[];
  commentaire_refus?: string;
  type_commentaire?: string;
  carteId?: number;
  modeNote?: boolean;
  onMapClick?: (lat: number, lng: number, x: number, y: number) => void;
  notes?: NoteOnMap[];
};

const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    "#be1526",
  moyenne:  "#ff0921",
  mauvaise: "#d66064",
};

const QUALITE_LABEL_MAP: Record<string, string> = {
  bonne:    'Très bonne',
  moyenne:  'Bonne',
  mauvaise: 'Limitée',
};

export default function ReadOnlyMap({
  carteId,
  polygons = [],
  commentaire_refus,
  type_commentaire,
  modeNote = false,
  onMapClick,
  notes = [],
}: ReadOnlyMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const noteMarkersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const modeNoteRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  const cacheBusterRef = useRef<number>(Date.now());

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    modeNoteRef.current = modeNote;
    if (mapRef.current) {
      mapRef.current.style.cursor = modeNote ? 'crosshair' : '';
    }
  }, [modeNote]);

  useEffect(() => {
    if (!instanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = instanceRef.current;

    noteMarkersRef.current.forEach(({ marker }) => {
      try { map.removeLayer(marker); } catch { }
    });
    noteMarkersRef.current = [];

    notes.forEach((note) => {
      if (!note.lat || !note.lng) return;
      const noteIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:#1e293b;color:white;width:32px;height:32px;
            border-radius:8px;display:flex;align-items:center;
            justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);
            cursor:pointer;font-size:14px;border:2px solid white;position:relative;
          ">
            <span style="font-weight:bold;font-family:sans-serif;">N</span>
            <div style="
              position:absolute;bottom:-7px;left:50%;
              transform:translateX(-50%);
              width:0;height:0;
              border-left:5px solid transparent;
              border-right:5px solid transparent;
              border-top:7px solid #1e293b;
            "></div>
          </div>
        `,
        iconAnchor: [16, 39],
        iconSize: [32, 39],
      });
      const marker = L.marker([note.lat, note.lng], { icon: noteIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:12px;min-width:150px;max-width:220px;">
          <strong style="color:#1e293b;font-size:11px;text-transform:uppercase;">Note</strong>
          <p style="color:#374151;margin:6px 0 0;line-height:1.5;font-weight:500;">${note.texte}</p>
        </div>
      `, { maxWidth: 250, closeButton: true });
      marker.on('click', () => marker.openPopup());
      noteMarkersRef.current.push({ id: note.id, marker });
    });
  }, [notes]);

  useEffect(() => {
    if (instanceRef.current) {
      try { instanceRef.current.remove(); } catch { }
      instanceRef.current = null;
    }
    if (!mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        await import('leaflet.vectorgrid');
        LRef.current = L;

        if (!isMounted || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          dragging: true, touchZoom: true, scrollWheelZoom: true,
          doubleClickZoom: true, zoomSnap: 1, wheelPxPerZoomLevel: 60,
        }).setView([34.5, 9.5], 7);
        instanceRef.current = map;

        const original = (map as any)._onZoomTransitionEnd;
        (map as any)._onZoomTransitionEnd = function (...args: any[]) {
          try { original.apply(this, args); } catch { }
        };

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
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

        const bounds: any[] = [];

        // ✅ Polygones manuels — local, instantané
        if (polygons && polygons.length > 0) {
          polygons.forEach((polygone) => {
            try {
              const coords = JSON.parse(polygone.coordinates);
              const latLngs = coords.map(([lng, lat]: [number, number]) => [lat, lng]);
              const color = QUALITE_COLOR_MAP[polygone.qualite] || '#be1526';
              const poly = L.polygon(latLngs, {
                color, fillColor: color, fillOpacity: 0.4, weight: 1.5,
              }).addTo(map);
              poly.bindPopup(`
                <div style="font-family:sans-serif;font-size:12px;">
                  <strong>Qualité :</strong> ${QUALITE_LABEL_MAP[polygone.qualite] || polygone.qualite}
                </div>
              `);
              bounds.push(...latLngs);
            } catch { }
          });
          if (bounds.length > 0) {
            try { map.fitBounds(bounds, { padding: [20, 20] }); } catch { }
          }
        }

        // ✅ MVT canvas pour SHP — rapide + pas de disparition au dézoom
        if (carteId) {
          try {
            const tileUrl = `http://localhost:3000/tiles/${carteId}/{z}/{x}/{y}.pbf?v=${cacheBusterRef.current}`;
            const vectorGridLayer = (L as any).vectorGrid.protobuf(tileUrl, {
              vectorTileLayerStyles: {
                shp_layer: (properties: any) => {
                  const color = QUALITE_COLOR_MAP[properties.qualite] || '#be1526';
                  return {
                    fillColor: color, fillOpacity: 0.4,
                    stroke: true, color, weight: 1.5, fill: true,
                  };
                },
              },
              maxZoom: 19,
              maxNativeZoom: 19,
              interactive: false,
              rendererFactory: (L as any).canvas.tile, // ✅ canvas
            });
            vectorGridLayer.addTo(map);
          } catch (e) { console.error('Erreur MVT:', e); }

          // ✅ fitBounds via bbox seulement si pas de polygones manuels
          if (bounds.length === 0) {
            fetch(`http://localhost:3000/tiles/${carteId}/bbox`)
              .then(r => r.json())
              .then(bbox => {
                if (bbox && isMounted) {
                  map.fitBounds(
                    [[bbox.ymin, bbox.xmin], [bbox.ymax, bbox.xmax]],
                    { padding: [20, 20] }
                  );
                }
              })
              .catch(() => {});
          }
        }

        // ✅ Notes de refus existantes
        if (type_commentaire === 'note' && commentaire_refus) {
          try {
            const existingNotes = JSON.parse(commentaire_refus) as { lat: number; lng: number; texte: string }[];
            existingNotes.forEach((note, idx) => {
              if (!note.lat || !note.lng) return;
              const noteIcon = L.divIcon({
                className: '',
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

        // ✅ Clic carte
        let mouseDownTime = 0;
        let mouseDownPos = { x: 0, y: 0 };

        map.on('mousedown', (e: any) => {
          mouseDownTime = Date.now();
          mouseDownPos = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
        });

        map.on('click', (e: any) => {
          if (!modeNoteRef.current || !onMapClickRef.current) return;
          const elapsed = Date.now() - mouseDownTime;
          const dx = Math.abs(e.originalEvent.clientX - mouseDownPos.x);
          const dy = Math.abs(e.originalEvent.clientY - mouseDownPos.y);
          if (elapsed > 300 || dx > 5 || dy > 5) return;
          const containerPoint = map.latLngToContainerPoint(e.latlng);
          onMapClickRef.current(e.latlng.lat, e.latlng.lng, containerPoint.x, containerPoint.y);
        });

        setTimeout(() => { if (isMounted) map.invalidateSize(); }, 200);

      } catch (error) { console.error(error); }
    };

    initMap();

    return () => {
      isMounted = false;
      if (instanceRef.current) {
        try { instanceRef.current.remove(); } catch { }
        instanceRef.current = null;
      }
    };
  }, [carteId]);

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

      <div ref={mapRef} className="w-full h-full min-h-[420px] rounded-2xl border border-gray-200" />
    </div>
  );
}