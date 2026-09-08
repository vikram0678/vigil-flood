import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useFlood } from '../../context/FloodContext';
import { BASEMAP_3D_SOURCES, DRONE_WAYPOINTS } from '../../constants';

export const GISMap3D: React.FC = () => {
  const { 
    villages, 
    selectedVillageId, 
    selectedVillageData, 
    selectVillage,
    viewMode,
    basemap3D, 
    isDroneFlying, 
    toggleDroneFlying,
    simulation 
  } = useFlood();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map3dInstanceRef = useRef<maplibregl.Map | null>(null);
  const markers3DRef = useRef<maplibregl.Marker[]>([]);
  const droneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-resize MapLibre GL whenever viewMode switches to 3D (Solves #8277 hidden container 400x300 issue)
  useEffect(() => {
    if (viewMode === '3d' && map3dInstanceRef.current) {
      const t1 = setTimeout(() => {
        if (map3dInstanceRef.current) {
          map3dInstanceRef.current.resize();
        }
      }, 50);

      const t2 = setTimeout(() => {
        if (map3dInstanceRef.current) {
          map3dInstanceRef.current.resize();
        }
      }, 250);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewMode]);

  // 1. Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!mapContainerRef.current || map3dInstanceRef.current) return;

    const defaultBasemap = BASEMAP_3D_SOURCES[basemap3D] || BASEMAP_3D_SOURCES.google_hybrid;

    const map3d = new maplibregl.Map({
      container: mapContainerRef.current,
      maxZoom: 18.5,
      minZoom: 2,
      maxPitch: 65,
      maxTileCacheSize: 250,
      style: {
        version: 8,
        sources: {
          'hybrid-satellite-source': {
            type: 'raster',
            tiles: defaultBasemap.tiles,
            tileSize: defaultBasemap.tileSize || 256,
            maxzoom: defaultBasemap.maxzoom || 20,
            attribution: defaultBasemap.attribution
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 12
          }
        },
        layers: [
          {
            id: 'hybrid-satellite-layer',
            type: 'raster',
            source: 'hybrid-satellite-source',
            minzoom: 0,
            maxzoom: 22
          }
        ],
        terrain: {
          source: 'terrain-dem',
          exaggeration: 1.5
        }
      },
      center: [77.0560, 31.6702],
      zoom: 13,
      pitch: 58,
      bearing: -25
    });

    map3dInstanceRef.current = map3d;
    markers3DRef.current = [];
    rendered3DCountRef.current = 0;
    lastFlown3DVillageIdRef.current = null;

    // ResizeObserver for 3D Map
    let resizeObserver3d: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver3d = new ResizeObserver(() => {
        if (map3dInstanceRef.current) {
          map3dInstanceRef.current.resize();
        }
      });
      resizeObserver3d.observe(mapContainerRef.current);
    }

    setTimeout(() => {
      if (map3dInstanceRef.current) {
        map3dInstanceRef.current.resize();
      }
    }, 150);

    map3d.on('load', () => {
      // 3D Flood water polygon source
      map3d.addSource('3d-flood-water-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map3d.addLayer({
        id: '3d-flood-water-fill',
        type: 'fill',
        source: '3d-flood-water-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.65
        }
      });

      // 3D Stream source
      map3d.addSource('3d-stream-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map3d.addLayer({
        id: '3d-stream-line-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 6,
          'line-opacity': 0.85
        }
      });

      map3d.addLayer({
        id: '3d-stream-pulse-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3.5,
          'line-opacity': 0.95,
          'line-dasharray': [0, 4, 3]
        }
      });

      // Continuous 3D flow pulse animation
      let step = 0;
      const animatePulse = () => {
        if (map3d.getLayer('3d-stream-pulse-layer')) {
          step = (step + 0.08) % 8;
          try {
            map3d.setPaintProperty('3d-stream-pulse-layer', 'line-dasharray', [step, Math.max(0.1, 4 - step), 4]);
          } catch (_) {}
        }
        animFrameRef.current = requestAnimationFrame(animatePulse);
      };
      animatePulse();
    });

    return () => {
      if (resizeObserver3d) resizeObserver3d.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
      map3d.remove();
      map3dInstanceRef.current = null;
      markers3DRef.current = [];
      rendered3DCountRef.current = 0;
      lastFlown3DVillageIdRef.current = null;
    };
  }, []);

  // 2. Basemap 3D Switcher
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    const cfg = BASEMAP_3D_SOURCES[basemap3D] || BASEMAP_3D_SOURCES.google_hybrid;

    try {
      if (map3d.getLayer('hybrid-satellite-layer')) {
        map3d.removeLayer('hybrid-satellite-layer');
      }
      if (map3d.getSource('hybrid-satellite-source')) {
        map3d.removeSource('hybrid-satellite-source');
      }

      map3d.addSource('hybrid-satellite-source', {
        type: 'raster',
        tiles: cfg.tiles,
        tileSize: cfg.tileSize || 256,
        maxzoom: cfg.maxzoom || 19,
        attribution: cfg.attribution
      });

      const beforeLayer = map3d.getLayer('3d-flood-water-fill') ? '3d-flood-water-fill' : undefined;
      map3d.addLayer({
        id: 'hybrid-satellite-layer',
        type: 'raster',
        source: 'hybrid-satellite-source',
        minzoom: 0,
        maxzoom: 22
      }, beforeLayer);
    } catch (err) {
      console.warn("3D basemap switch:", err);
    }
  }, [basemap3D]);

  // 3. Render 3D Village Markers & Shelters ONCE
  const rendered3DCountRef = useRef<number>(0);
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || villages.length === 0) return;
    if (rendered3DCountRef.current === villages.length && markers3DRef.current.length > 0) return;
    rendered3DCountRef.current = villages.length;

    // Clear previous markers
    markers3DRef.current.forEach(m => m.remove());
    markers3DRef.current = [];

    villages.forEach(v => {
      // Village 3D Floating Name Badge
      const el = document.createElement("div");
      el.className = "marker-3d-village-badge";
      el.innerHTML = `
        <div class="badge-3d-bubble">
          <span class="badge-3d-dot"></span>
          <span><b>${v.name}</b> (${v.elevation_m}m)</span>
        </div>
      `;
      el.onclick = () => selectVillage(v.id);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([v.lng, v.lat])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`
          <div style="font-family:sans-serif; padding:4px;">
            <div style="font-weight:700; color:#0284c7;">🏔️ ${v.name} (${v.ward})</div>
            <div style="font-size:11px;">Elevation: <b>${v.elevation_m}m</b> | Slope: <b>${v.slope_deg}°</b></div>
            <div style="font-size:11px; color:#ef4444; font-weight:700; margin-top:2px;">Threat: ${v.risk_percentage}% (${v.risk_level})</div>
          </div>
        `))
        .addTo(map3d);

      markers3DRef.current.push(marker);

      // Safe Ridge Shelter 3D Marker
      const shelters = v.safe_shelters || v.shelters || [];
      shelters.forEach(s => {
        const shelterEl = document.createElement("div");
        shelterEl.className = "marker-3d-shelter-badge";
        shelterEl.innerHTML = `
          <div class="shelter-3d-bubble">
            ⛺ <b>${s.name}</b> (${s.elevation_m}m)
          </div>
        `;
        const shelterMarker = new maplibregl.Marker({ element: shelterEl })
          .setLngLat([s.lng, s.lat])
          .addTo(map3d);

        markers3DRef.current.push(shelterMarker);
      });
    });
  }, [villages, selectVillage]);

  // 4. Update 3D Inundation & River stream lines based on simulation sliders
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (!v) return;

    // Update Stream
    if (v.river_stream && map3d.getSource('3d-stream-source')) {
      const streamGeoJson = v.river_stream.map(pt => [pt[1], pt[0]]);
      const streamWidth = Math.max(6, simulation.water * 4.5 + (simulation.rain > 80 ? 6 : 0));
      (map3d.getSource('3d-stream-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: streamGeoJson },
          properties: { stream_width: streamWidth }
        }]
      });
    }

    // Update Inundation Polygon
    const inundationPts = v.hazard_zones?.red_inundation_polygon || v.inundation_polygon;
    if (inundationPts && map3d.getSource('3d-flood-water-source')) {
      const polyGeoJson = [inundationPts.map(pt => [pt[1], pt[0]])];
      (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: polyGeoJson },
          properties: { water_level: simulation.water }
        }]
      });
    }
  }, [selectedVillageData, selectedVillageId, simulation, villages]);

  // 4b. Camera fly-to ONLY when selected village explicitly changes in 3D view
  const lastFlown3DVillageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !selectedVillageId || isDroneFlying || viewMode !== '3d') return;
    if (lastFlown3DVillageIdRef.current === selectedVillageId) return;

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (v && typeof v.lng === 'number' && typeof v.lat === 'number' && !isNaN(v.lng) && !isNaN(v.lat)) {
      lastFlown3DVillageIdRef.current = selectedVillageId;
      try {
        map3d.flyTo({
          center: [v.lng, v.lat],
          zoom: 13.5,
          pitch: 58,
          bearing: -25,
          duration: 2000
        });
      } catch (err) {
        console.warn("MapLibre flyTo error:", err);
      }
    }
  }, [selectedVillageId, villages, selectedVillageData, isDroneFlying, viewMode]);

  // 5. Drone Flythrough Sequence
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    if (isDroneFlying) {
      let wpIdx = 0;
      const flyNext = () => {
        if (!isDroneFlying) return;
        const wp = DRONE_WAYPOINTS[wpIdx];
        map3d.flyTo({
          center: wp.center as [number, number],
          zoom: wp.zoom,
          pitch: wp.pitch,
          bearing: wp.bearing,
          duration: 4500,
          essential: true
        });
        wpIdx = (wpIdx + 1) % DRONE_WAYPOINTS.length;
        droneTimerRef.current = setTimeout(flyNext, 5000);
      };
      flyNext();
    } else {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    }

    return () => {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    };
  }, [isDroneFlying]);

  return (
    <div 
      ref={mapContainerRef} 
      id="gis-map-3d" 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};
