'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export const QUALITE_OPTIONS = [
  { label: "Très bonne", value: "bonne",    color: "#be1526" },
  { label: "Bonne",      value: "moyenne",  color: "#ff0921" },
  { label: "Limitée",    value: "mauvaise", color: "#d66064" },
];

const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    "#be1526",
  moyenne:  "#ff0921",
  mauvaise: "#d66064",
};

interface MapProps {
  onSave: (polygone: { coordinates: string; qualite: string }) => void;
  onEdit?: (polygones: { coordinates: string; qualite: string }[]) => void;
  qualite?: string;
  qualiteColor?: string;
  initialPolygons?: { coordinates: string; qualite: string }[];
  onReady?: (focusFn: (coords: number[][]) => void) => void;
  sessionId?: string;
  carteId?: number;
  excludeQualite?: string;
  importCount?: number; // ✅ incrémenté à chaque import pour forcer le rechargement
}

export default function MapComponent({
  onSave,
  onEdit,
  qualite = "bonne",
  qualiteColor = "#be1526",
  initialPolygons = [],
  onReady,
  sessionId,
  carteId,
  excludeQualite,
  importCount = 0,
}: MapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const vectorGridLayerRef = useRef<any>(null);
  const vectorGridCarteRef = useRef<any>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  const onEditRef = useRef(onEdit);
  const onReadyRef = useRef(onReady);
  const colorRef = useRef(qualiteColor);
  const qualiteRef = useRef(qualite);
  const isMountedRef = useRef(true);
  const clickMarkerRef = useRef<any>(null);
  const sessionIdRef = useRef(sessionId);
  const carteIdRef = useRef(carteId);
  const excludeQualiteRef = useRef(excludeQualite);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const isLongPressRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidate = () => {
    const map = mapInstanceRef.current;
    if (!map || !isMountedRef.current) return;
    try { map.invalidateSize({ animate: false }); } catch { }
  };

  useEffect(() => {
    isMountedRef.current = true;
    setIsClient(true);
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  useEffect(() => { onEditRef.current = onEdit; }, [onEdit]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { colorRef.current = qualiteColor; }, [qualiteColor]);
  useEffect(() => { qualiteRef.current = qualite; }, [qualite]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { carteIdRef.current = carteId; }, [carteId]);
  useEffect(() => { excludeQualiteRef.current = excludeQualite; }, [excludeQualite]);

  // ─────────────────────────────────────────────────────────
  // ✅ Chargement GeoJSON quand sessionId change
  // Accumule tous les layers sans supprimer les précédents
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isClient || !sessionId) return;

    const loadGeoJson = async () => {
      try {
        const L = (await import('leaflet')).default;

        // ✅ Supprimer uniquement l'ancien layer du MÊME sessionId
        // (pas les autres qualités déjà affichées)
        if (vectorGridLayerRef.current) {
          try { map.removeLayer(vectorGridLayerRef.current); } catch { }
          vectorGridLayerRef.current = null;
        }

        // ✅ Charger TOUTES les qualités du sessionId courant
        const res = await fetch(`http://localhost:3000/tiles/temp/${sessionId}/geojson`);
        if (!res.ok) return;
        const geojson = await res.json();

        if (!geojson?.features?.length) return;

        const layer = L.geoJSON(geojson, {
          style: (feature: any) => {
            const color = QUALITE_COLOR_MAP[feature?.properties?.qualite] || '#be1526';
            return {
              fillColor: color,
              fillOpacity: 0.4,
              color: color,
              weight: 1.5,
            };
          }
        }).addTo(map);

        vectorGridLayerRef.current = layer;

        try {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        } catch { }

      } catch (e) {
        console.error('Erreur chargement GeoJSON:', e);
      }
    };

    loadGeoJson();
  }, [sessionId, isClient, importCount]); // ✅ importCount force le rechargement

  useEffect(() => {
    const handleFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(invalidate, 100);
      setTimeout(invalidate, 300);
      setTimeout(invalidate, 500);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!isClient || !wrapperRef.current) return;
    const observer = new ResizeObserver(() => {
      if (isMountedRef.current) setTimeout(invalidate, 100);
    });
    observer.observe(wrapperRef.current);
    window.addEventListener('resize', invalidate);
    return () => { observer.disconnect(); window.removeEventListener('resize', invalidate); };
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;
    let localMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet-draw');
        await import('leaflet/dist/leaflet.css');
        await import('leaflet-draw/dist/leaflet.draw.css');
        await import('leaflet.vectorgrid');

        if (!localMounted || !isMountedRef.current || !mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        try {
          const SWZ = (L as any).Map.ScrollWheelZoom;
          if (SWZ?.prototype._performZoom) {
            const orig = SWZ.prototype._performZoom;
            SWZ.prototype._performZoom = function () {
              try { if (!this._map?._mapPane?._leaflet_pos) return; orig.call(this); } catch { }
            };
          }
        } catch { }

        try {
          const MapProto = (L as any).Map.prototype;
          if (!MapProto._patchedZoomEnd) {
            const _origZoom = MapProto._onZoomTransitionEnd;
            MapProto._onZoomTransitionEnd = function () {
              try { if (!this._mapPane || !this._mapPane._leaflet_pos) return; _origZoom.call(this); } catch { }
            };
            MapProto._patchedZoomEnd = true;
          }
        } catch { }

        const map = L.map(mapContainerRef.current, {
          dragging: true, touchZoom: true, scrollWheelZoom: true,
          doubleClickZoom: true, boxZoom: true, keyboard: true,
          inertia: true, inertiaDeceleration: 3000, inertiaMaxSpeed: 1500,
          zoomSnap: 0.5, zoomDelta: 0.5, trackResize: true,
          worldCopyJump: false, closePopupOnClick: false,
          fadeAnimation: true, zoomAnimation: true, markerZoomAnimation: true,
          renderer: L.canvas(),
        }).setView([34.5, 9.5], 7);

        mapInstanceRef.current = map;
        map.dragging.enable();

        map.on('contextmenu', (e: any) => { L.DomEvent.stopPropagation(e); return false; });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© Ooredoo Network Planning', maxZoom: 19, keepBuffer: 4,
        }).addTo(map);

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        const bounds: any[] = [];
        if (initialPolygons?.length > 0) {
          initialPolygons.forEach((polygone) => {
            try {
              const coords = JSON.parse(polygone.coordinates);
              const latLngs = coords.map(([lng, lat]: [number, number]) => [lat, lng]);
              const color = QUALITE_COLOR_MAP[polygone.qualite] || '#6b7280';
              const poly = (L as any).polygon(latLngs, { color, fillColor: color, fillOpacity: 0.4, weight: 3 });
              (poly as any)._qualite = polygone.qualite;
              drawnItems.addLayer(poly);
              bounds.push(...latLngs);
            } catch { }
          });
          if (bounds.length > 0) {
            try { map.fitBounds(bounds, { padding: [30, 30] }); } catch { }
          }
        }

        // ─────────────────────────────────────────────────────────
        // MVT pour carte existante (carteId) — reste en MVT car déjà sauvegardée
        // ─────────────────────────────────────────────────────────
        if (carteIdRef.current) {
          try {
            const excludeParam = excludeQualiteRef.current ? `?exclude_qualite=${excludeQualiteRef.current}` : '';
            const tileUrl = `http://localhost:3000/tiles/${carteIdRef.current}/{z}/{x}/{y}.pbf${excludeParam}`;
            const vectorGridLayer = (L as any).vectorGrid.protobuf(tileUrl, {
              vectorTileLayerStyles: {
                shp_layer: (properties: any) => {
                  const color = QUALITE_COLOR_MAP[properties.qualite] || '#6b7280';
                  return { fillColor: color, fillOpacity: 0.4, stroke: true, color, weight: 1.5, fill: true };
                },
              },
              maxZoom: 19,
              maxNativeZoom: 19,
              interactive: false,
              rendererFactory: (L as any).svg.tile,
            });
            vectorGridLayer.addTo(map);
            vectorGridCarteRef.current = vectorGridLayer;
          } catch (e) { console.error('Erreur VectorGrid carteId:', e); }
        }

        // ─────────────────────────────────────────────────────────
        // ✅ Session temp : chargé via GeoJSON dans le useEffect dédié
        // (si sessionId est déjà défini au montage)
        // ─────────────────────────────────────────────────────────
        if (sessionIdRef.current) {
          try {
            const res = await fetch(`http://localhost:3000/tiles/temp/${sessionIdRef.current}/geojson`);
            if (res.ok) {
              const geojson = await res.json();
              if (geojson?.features?.length) {
                const layer = L.geoJSON(geojson, {
                  style: (feature: any) => {
                    const color = QUALITE_COLOR_MAP[feature?.properties?.qualite] || '#be1526';
                    return { fillColor: color, fillOpacity: 0.4, color, weight: 1.5 };
                  }
                }).addTo(map);
                vectorGridLayerRef.current = layer;
                try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch { }
              }
            }
          } catch (e) { console.error('Erreur GeoJSON sessionId init:', e); }
        }

        // Légende
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
              ${QUALITE_OPTIONS.map(q => `
                <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
                  <span style="width:12px;height:12px;border-radius:50%;background:${q.color};display:inline-block;flex-shrink:0;"></span>
                  <span style="color:#ccc;font-weight:700;font-size:11px;">${q.label}</span>
                </div>
              `).join('')}
            `;
            return div;
          }
        });
        new LegendControl({ position: 'bottomleft' }).addTo(map);

        map.on('mousedown', () => {
          isLongPressRef.current = false;
          if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
        });

        map.on('mouseup', (e: any) => {
          if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
          if (!isLongPressRef.current && isMountedRef.current) {
            const { lat, lng } = e.latlng;
            setClickCoords({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
            if (clickMarkerRef.current) map.removeLayer(clickMarkerRef.current);
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`
              <div style="font-family:sans-serif;font-size:12px;line-height:1.6;">
                <strong>Coordonnées</strong><br/>
                Lat: ${lat.toFixed(6)}<br/>
                Lng: ${lng.toFixed(6)}
              </div>
            `).openPopup();
            clickMarkerRef.current = marker;
          }
          isLongPressRef.current = false;
        });

        map.on('dragstart', () => { isLongPressRef.current = true; });

        const drawPlugin = (L as any).Control.Draw;
        const drawControl = new drawPlugin({
          edit: { featureGroup: drawnItems },
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: { color: colorRef.current, fillColor: colorRef.current, fillOpacity: 0.4, weight: 3 }
            },
            polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false,
          }
        });
        map.addControl(drawControl);

        if (onReadyRef.current) {
          onReadyRef.current((coords: number[][]) => {
            try {
              const latLngs = coords.map(([lng, lat]: number[]) => [lat, lng]);
              map.fitBounds(latLngs as any, { padding: [50, 50], maxZoom: 14 });
            } catch { }
          });
        }

        map.on((L as any).Draw.Event.CREATED, (e: any) => {
          if (!isMountedRef.current) return;
          const layer = e.layer;
          layer.setStyle({ color: colorRef.current, fillColor: colorRef.current, fillOpacity: 0.4, weight: 3 });
          (layer as any)._qualite = qualiteRef.current;
          drawnItems.addLayer(layer);
          const coords = layer.getLatLngs()[0].map((ll: any) => [ll.lng, ll.lat]);
          onSaveRef.current({ coordinates: JSON.stringify(coords), qualite: qualiteRef.current });
        });

        map.on((L as any).Draw.Event.EDITED, () => {
          if (!isMountedRef.current) return;
          const allPolygons: { coordinates: string; qualite: string }[] = [];
          drawnItems.eachLayer((layer: any) => {
            try {
              const latLngs = layer.getLatLngs();
              const points = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
              const coords = points.map((ll: any) => [ll.lng, ll.lat]);
              allPolygons.push({ coordinates: JSON.stringify(coords), qualite: (layer as any)._qualite || qualiteRef.current });
            } catch { }
          });
          onEditRef.current?.(allPolygons);
        });

        map.on((L as any).Draw.Event.DELETED, () => {
          if (!isMountedRef.current) return;
          const allPolygons: { coordinates: string; qualite: string }[] = [];
          drawnItems.eachLayer((layer: any) => {
            try {
              const latLngs = layer.getLatLngs();
              const points = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
              const coords = points.map((ll: any) => [ll.lng, ll.lat]);
              allPolygons.push({ coordinates: JSON.stringify(coords), qualite: (layer as any)._qualite || qualiteRef.current });
            } catch { }
          });
          onEditRef.current?.(allPolygons);
        });

        mapContainerRef.current.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });

        setTimeout(() => {
          try { map.invalidateSize(); map.dragging.enable(); } catch { }
        }, 300);

      } catch (error) { console.error('Erreur Leaflet:', error); }
    };

    initTimeoutRef.current = setTimeout(initMap, 100);

    return () => {
      localMounted = false;
      isMountedRef.current = false;
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.options.zoomAnimation = false;
          mapInstanceRef.current.options.fadeAnimation = false;
          try { mapInstanceRef.current.scrollWheelZoom.disable(); } catch { }
          try { mapInstanceRef.current.touchZoom.disable(); } catch { }
          try { mapInstanceRef.current.doubleClickZoom.disable(); } catch { }
          (mapInstanceRef.current as any)._onZoomTransitionEnd = function () {};
          mapInstanceRef.current.remove();
        } catch { }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) (mapContainerRef.current as any)._leaflet_id = undefined;
    };
  }, [isClient]);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) await wrapperRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) { console.error('Erreur fullscreen:', err); }
  };

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
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = (await import('leaflet')).default;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.setView([lat, lng], 13);
    if (clickMarkerRef.current) map.removeLayer(clickMarkerRef.current);
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`
      <div style="font-family:sans-serif;font-size:12px;line-height:1.6;">
        <strong>${result.display_name.split(',')[0]}</strong><br/>
        Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}
      </div>
    `).openPopup();
    clickMarkerRef.current = marker;
    setClickCoords({ lat, lng });
    setShowResults(false);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  if (!isClient) {
    return (
      <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ED1C24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full"
      style={{ background: '#fff', borderRadius: isFullscreen ? 0 : '1rem' }}
    >
      <div
        ref={mapContainerRef}
        style={{ position: 'absolute', inset: 0, borderRadius: isFullscreen ? 0 : '1rem' }}
      />

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
            {searchLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Rechercher'}
          </button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
              >
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

      {/* Bouton plein écran */}
      <button
        onClick={toggleFullscreen}
        style={{ position: 'absolute', top: 60, right: 12, zIndex: 1001 }}
        className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-md hover:bg-gray-50 transition-all"
        title={isFullscreen ? 'Réduire' : 'Agrandir'}
      >
        {isFullscreen
          ? <Minimize2 size={18} className="text-gray-700" />
          : <Maximize2 size={18} className="text-gray-700" />
        }
      </button>

      {/* Coordonnées */}
      {clickCoords && (
        <div
          style={{ position: 'absolute', bottom: 16, right: 12, zIndex: 1000 }}
          className="bg-black bg-opacity-80 text-white px-4 py-2.5 rounded-xl text-xs font-mono shadow-lg"
        >
          <p className="font-bold text-gray-300 mb-1 uppercase tracking-wide text-[10px]">Coordonnées</p>
          <p>Lat: <span className="text-green-400">{clickCoords.lat}</span></p>
          <p>Lng: <span className="text-green-400">{clickCoords.lng}</span></p>
          <button
            onClick={() => navigator.clipboard.writeText(`${clickCoords.lat}, ${clickCoords.lng}`)}
            className="mt-1.5 text-[10px] text-gray-400 hover:text-white underline transition-colors"
          >
            Copier
          </button>
        </div>
      )}
    </div>
  );
}