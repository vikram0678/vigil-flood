import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useFlood } from '../../context/FloodContext';
import { BASEMAP_3D_SOURCES, DRONE_WAYPOINTS } from '../../constants';

// Helper: Stream browser map events directly to Python terminal
const sendTerminalLog = (level: 'INFO' | 'WARN' | 'ERROR', message: string) => {
  fetch('/api/logs/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, module: '3D_MAP', message })
  }).catch(() => { });
};


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
      minZoom: 4, // Full India subcontinent overview allowed
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
      center: [78.9, 22.5],
      zoom: 4.8,
      pitch: 20,
      bearing: 0
    });

    map3dInstanceRef.current = map3d;
    (window as any).map3dInstance = map3d;
    markers3DRef.current = [];
    rendered3DCountRef.current = 0;
    lastFlown3DVillageIdRef.current = null;

    // Add unified distance scale controls (metric & imperial)
    try {
      const scaleCtrl = new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' });
      map3d.addControl(scaleCtrl, 'bottom-left');
    } catch (e) {
      console.warn("ScaleControl metric add error:", e);
    }

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

    // Logging MapLibre GL Lifecycle & WebGL Status
    map3d.on('load', () => {
      sendTerminalLog('INFO', '✅ MapLibre 3D Style & Terrain Mesh initialized successfully!');
      console.log("🏔️ [3D-MAP] MapLibre Style, Satellite Raster & 3D Terrain Loaded Successfully!");
    });

    map3d.on('error', (e) => {
      sendTerminalLog('ERROR', `🚨 MapLibre Engine Error: ${e.error?.message || JSON.stringify(e)}`);

      console.error("🚨 [3D-MAP ERROR]:", e.error || e);
    });

    map3d.on('sourcedata', (e) => {
      if (e.isSourceLoaded) {
        const sourceType = e.source?.type || 'geojson';
        sendTerminalLog('INFO', `📡 Source "${e.sourceId}" (Format: ${sourceType}) loaded into GPU memory.`);
        sendTerminalLog('INFO', `📡 Source "${e.sourceId}" (${e.sourceDataType || 'raster'}) loaded into GPU memory.`);
        console.log(`📡 [3D-MAP SOURCE] Source "${e.sourceId}" (dataType: ${e.sourceDataType}) loaded.`);
      }
    });

    map3d.on('tileerror', (e: any) => {
      const coord = e.tile?.tileID?.canonical ? `z:${e.tile.tileID.canonical.z} x:${e.tile.tileID.canonical.x} y:${e.tile.tileID.canonical.y}` : 'Unknown';
      sendTerminalLog('WARN', `⚠️ Tile load failed at [${coord}] - Error: ${e.error?.message || e.error || 'Network/CORS block'}`);
      console.warn("⚠️ [3D-MAP TILE ERROR]:", e.tile?.tileID?.canonical, e.error);
    });

    map3d.on('webglcontextlost', (e) => {
      sendTerminalLog('ERROR', '🚨 WebGL GPU Context Lost! Graphics card reset or out of memory.');
      console.error("🚨 [3D-MAP WEBGL CONTEXT LOST]:", e);
    });

    map3d.on('webglcontextrestored', () => {
      sendTerminalLog('INFO', '✅ WebGL GPU Context Restored.');

      console.log("✅ [3D-MAP WEBGL CONTEXT RESTORED]");
    });

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
          'line-opacity': 0.8,
          'line-dasharray': [2, 3]
        }
      });

      // Continuous 3D flow pulse animation
      let pulseStep = 0;
      const animatePulse = () => {
        if (map3d.getLayer('3d-stream-pulse-layer')) {
          pulseStep += 0.05;
          const opacity = 0.55 + 0.4 * Math.sin(pulseStep); // Smooth wave between 0.15 and 0.95
          try {
            map3d.setPaintProperty('3d-stream-pulse-layer', 'line-opacity', opacity);
          } catch (_) { }
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
    console.log(`🗺️ [3D BASEMAP SWITCH] Switching to "${basemap3D}" (${cfg.name})`, cfg.tiles);

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

    if (!selectedVillageData) {
      if (map3d.getSource('3d-stream-source')) {
        (map3d.getSource('3d-stream-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      if (map3d.getSource('3d-flood-water-source')) {
        (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      return;
    }

    const v = selectedVillageData.village;

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

  // 4b. Camera fly-to for village selection and deselect to All-India view
  const lastFlown3DVillageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || isDroneFlying || viewMode !== '3d') return;
    if (lastFlown3DVillageIdRef.current === selectedVillageId) return;

    lastFlown3DVillageIdRef.current = selectedVillageId;

    if (!selectedVillageId) {
      try {
        map3d.flyTo({
          center: [78.9, 22.5],
          zoom: 4.8,
          pitch: 20,
          bearing: 0,
          duration: 1800
        });
      } catch (err) {
        console.warn("MapLibre flyTo India overview error:", err);
      }
      return;
    }

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (v && typeof v.lng === 'number' && typeof v.lat === 'number' && !isNaN(v.lng) && !isNaN(v.lat)) {
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

  // 5. Dynamic Village-Specific Drone Flythrough Sequence
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    if (isDroneFlying) {
      const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId) || villages[0];
      if (!v) return;

      const shelters = v.safe_shelters || v.shelters || [];
      const primaryShelter = shelters[0];
      const stream = v.river_stream || [];
      const upstreamPt = stream.length > 0 ? stream[0] : null;
      const downstreamPt = stream.length > 0 ? stream[stream.length - 1] : null;

      const dynamicWaypoints: Array<{ center: [number, number]; zoom: number; pitch: number; bearing: number; desc: string }> = [];

      // 1. Upstream River Inflow & Mountain Gorge Approach
      if (upstreamPt && typeof upstreamPt[0] === 'number' && typeof upstreamPt[1] === 'number') {
        dynamicWaypoints.push({
          center: [upstreamPt[1], upstreamPt[0]],
          zoom: 14.2,
          pitch: 65,
          bearing: -25,
          desc: `Upstream Gorge Inflow (${v.name})`
        });
      }

      // 2. Direct Village Core & Riverside Inundation Zone Focus
      dynamicWaypoints.push({
        center: [v.lng, v.lat],
        zoom: 15.0,
        pitch: 62,
        bearing: 15,
        desc: `Village Center (${v.name}) Threat Zone`
      });

      // 3. Primary Safe Relief Shelter (Elevated Mountain Ridge Haven)
      if (primaryShelter && typeof primaryShelter.lng === 'number' && typeof primaryShelter.lat === 'number') {
        dynamicWaypoints.push({
          center: [primaryShelter.lng, primaryShelter.lat],
          zoom: 15.2,
          pitch: 52,
          bearing: 45,
          desc: `Safe Relief Shelter (${primaryShelter.name})`
        });
      }

      // 4. Downstream Runoff Gorge & Basin Overview
      if (downstreamPt && typeof downstreamPt[0] === 'number' && typeof downstreamPt[1] === 'number') {
        dynamicWaypoints.push({
          center: [downstreamPt[1], downstreamPt[0]],
          zoom: 13.8,
          pitch: 60,
          bearing: -65,
          desc: `Downstream Runoff Gorge (${v.name})`
        });
      } else {
        dynamicWaypoints.push({
          center: [v.lng, v.lat],
          zoom: 13.6,
          pitch: 55,
          bearing: 180,
          desc: `360° Tactical Valley Overview (${v.name})`
        });
      }

      let wpIdx = 0;
      const flyNext = () => {
        if (!isDroneFlying || !map3dInstanceRef.current) return;
        const wp = dynamicWaypoints[wpIdx];
        if (wp) {
          map3d.flyTo({
            center: wp.center,
            zoom: wp.zoom,
            pitch: wp.pitch,
            bearing: wp.bearing,
            duration: 4500,
            essential: true
          });
        }
        wpIdx = (wpIdx + 1) % dynamicWaypoints.length;
        droneTimerRef.current = setTimeout(flyNext, 5000);
      };
      flyNext();
    } else {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    }

    return () => {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    };
  }, [isDroneFlying, selectedVillageId, selectedVillageData, villages]);

  return (
    <div
      ref={mapContainerRef}
      id="gis-map-3d"
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};




// hey if we implement this 
// how the solution will be improveed 
// is that ok to do ??
// what do u say about this