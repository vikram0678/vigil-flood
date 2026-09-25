import React, { useEffect, useRef, useState } from 'react';
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
    layers,
    isDroneFlying,
    toggleDroneFlying,
    simulation,
    activeBasin,
    activeBasinId
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
      pitch: 0,
      bearing: 0
    });

    map3dInstanceRef.current = map3d;
    (window as any).map3dInstance = map3d;
    markers3DRef.current = [];
    lastFlown3DVillageIdRef.current = null;

    // Add unified distance scale controls (metric)
    try {
      const scaleCtrl = new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' });
      map3d.addControl(scaleCtrl, 'bottom-right');
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
    });

    map3d.on('load', () => {
      // 3D Topographic Elevation Contours Layer (100m interval lines)
      const generateContourFeatures = () => {
        const features = [];
        // Beas Basin bounding box approx lat 31.60 to 31.85, lng 77.00 to 77.25
        for (let elev = 800; elev <= 1600; elev += 100) {
          const latOffset = (elev - 800) * 0.00028;
          const coords = [
            [77.020 + latOffset * 0.4, 31.650 + latOffset],
            [77.060 + latOffset * 0.2, 31.680 + latOffset * 0.8],
            [77.100 - latOffset * 0.1, 31.710 + latOffset * 0.9],
            [77.150 - latOffset * 0.3, 31.750 + latOffset * 0.7],
            [77.210 - latOffset * 0.5, 31.780 + latOffset * 0.6]
          ];
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: { elevation_m: elev, label: `${elev}m` }
          });
        }
        return { type: 'FeatureCollection', features };
      };

      map3d.addSource('3d-topo-contours-source', {
        type: 'geojson',
        data: generateContourFeatures()
      });

      map3d.addLayer({
        id: '3d-topo-contours-line',
        type: 'line',
        source: '3d-topo-contours-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.2,
          'line-opacity': 0.45,
          'line-dasharray': [3, 2]
        }
      });

      // 3D Green Safe Ridge Zone Layer
      map3d.addSource('3d-green-safe-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map3d.addLayer({
        id: '3d-green-safe-fill',
        type: 'fill',
        source: '3d-green-safe-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.30
        }
      });

      // 3D Orange Slope / Vulnerability Buffer Zone Layer
      map3d.addSource('3d-orange-slope-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map3d.addLayer({
        id: '3d-orange-slope-fill',
        type: 'fill',
        source: '3d-orange-slope-source',
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': 0.35
        }
      });

      // 3D Flood water / Red Core Inundation Polygon Source
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
          'fill-opacity': 0.60
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
          'line-width': 7,
          'line-opacity': 0.9
        }
      });

      map3d.addLayer({
        id: '3d-stream-pulse-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 4,
          'line-opacity': 0.85,
          'line-dasharray': [2, 3]
        }
      });

      // Continuous 3D downhill water velocity pulse animation
      let pulseStep = 0;
      const animatePulse = () => {
        if (map3d.getLayer('3d-stream-pulse-layer')) {
          pulseStep += 0.06;
          const opacity = 0.55 + 0.4 * Math.sin(pulseStep);
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

  // 3. Render 3D Village Markers, Shelters & Sensors (Only for Active Selected Village)
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    // Clear previous markers
    markers3DRef.current.forEach(m => m.remove());
    markers3DRef.current = [];

    // When at All-India National Overview (no village selected), keep map uncluttered
    if (!selectedVillageId && !selectedVillageData) {
      return;
    }

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (!v) return;

    // 1. Selected Village 3D Floating Name Badge
    const el = document.createElement("div");
    el.className = "marker-3d-village-badge active-selected";
    el.innerHTML = `
      <div class="badge-3d-bubble">
        <span class="badge-3d-dot"></span>
        <span><b>${v.name}</b> (${v.elevation_m}m)</span>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
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

    // 2. Safe Ridge Shelter 3D Marker
    const shelters = v.safe_shelters || v.shelters || [];
    if (shelters.length > 0) {
      shelters.forEach(s => {
        const shelterEl = document.createElement("div");
        shelterEl.className = "marker-3d-shelter-badge";
        shelterEl.innerHTML = `
          <div class="shelter-3d-bubble">
            ⛺ <b>${s.name}</b> (${s.elevation_m}m)
          </div>
        `;
        const shelterMarker = new maplibregl.Marker({ element: shelterEl, anchor: 'bottom' })
          .setLngLat([s.lng, s.lat])
          .addTo(map3d);

        markers3DRef.current.push(shelterMarker);
      });
    }

    // 3. IoT Gauge 3D Marker
    const sensors = v.sensor_locations || [];
    if (sensors.length > 0) {
      sensors.forEach(sens => {
        const sensorEl = document.createElement("div");
        sensorEl.className = "marker-3d-sensor-badge";
        sensorEl.innerHTML = `
          <div class="sensor-3d-bubble">
            📡 <b>${sens.type}</b>
          </div>
        `;
        const sensorMarker = new maplibregl.Marker({ element: sensorEl, anchor: 'bottom' })
          .setLngLat([sens.lng, sens.lat])
          .addTo(map3d);

        markers3DRef.current.push(sensorMarker);
      });
    }
  }, [selectedVillageId, selectedVillageData, villages]);

  // 4. Update 3D Inundation & River stream lines based on simulation sliders
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    if (!selectedVillageData) {
      // Basin-wide 3D Streams
      const allStreams: any[] = [];
      const allRedPolys: any[] = [];
      villages.forEach(v => {
        if (v.river_stream && v.river_stream.length > 1) {
          allStreams.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: v.river_stream.map(pt => [pt[1], pt[0]]) },
            properties: { stream_width: 7 }
          });
        }
        const redPts = v.hazard_zones?.red_inundation_polygon || v.inundation_polygon;
        if (redPts && redPts.length > 0) {
          allRedPolys.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [redPts.map(pt => [pt[1], pt[0]])] },
            properties: { water_level: 1.0 }
          });
        }
      });

      if (map3d.getSource('3d-stream-source')) {
        (map3d.getSource('3d-stream-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: allStreams
        });
      }
      if (map3d.getSource('3d-flood-water-source')) {
        (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: allRedPolys
        });
      }
      if (map3d.getSource('3d-orange-slope-source')) {
        (map3d.getSource('3d-orange-slope-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      if (map3d.getSource('3d-green-safe-source')) {
        (map3d.getSource('3d-green-safe-source') as maplibregl.GeoJSONSource).setData({
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

    // 1. Update 🔴 Red Inundation / Core Disaster Polygon
    const redPts = v.hazard_zones?.red_inundation_polygon || v.inundation_polygon;
    if (redPts && map3d.getSource('3d-flood-water-source')) {
      const polyGeoJson = [redPts.map(pt => [pt[1], pt[0]])];
      (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: polyGeoJson },
          properties: { water_level: simulation.water }
        }]
      });
    }

    // 2. Update 🟠 Orange Vulnerability & Slope Buffer Polygon
    const orangePts = v.hazard_zones?.orange_slope_polygon;
    if (orangePts && map3d.getSource('3d-orange-slope-source')) {
      const orangeGeoJson = [orangePts.map(pt => [pt[1], pt[0]])];
      (map3d.getSource('3d-orange-slope-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: orangeGeoJson },
          properties: { buffer_type: 'slope_vulnerability' }
        }]
      });
    }

    // 3. Update 🟢 Green / 🟡 Watch Refuge Polygon
    const greenPts = v.hazard_zones?.green_safe_polygon;
    if (greenPts && map3d.getSource('3d-green-safe-source')) {
      const greenGeoJson = [greenPts.map(pt => [pt[1], pt[0]])];
      (map3d.getSource('3d-green-safe-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: greenGeoJson },
          properties: { buffer_type: 'safe_refuge' }
        }]
      });
    }
  }, [selectedVillageData, selectedVillageId, simulation, villages]);

  // Layer visibility sync for 3D MapLibre
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    const setVis = (layerId: string, visible: boolean) => {
      try {
        if (map3d.getLayer(layerId)) {
          map3d.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      } catch (e) {}
    };

    setVis('3d-flood-water-fill', layers.hazardZones);
    setVis('3d-orange-slope-fill', layers.hazardZones);
    setVis('3d-green-safe-fill', layers.hazardZones);
    setVis('3d-stream-line-layer', layers.streams);
    setVis('3d-stream-pulse-layer', layers.streams);
    setVis('3d-topo-contours-line', layers.contoursDEM);

    // Toggle 3D marker badges with zoom threshold (Hide when zoomed out at All-India overview)
    const updateMarkerZoomVis = () => {
      const isZoomedIn = (map3d.getZoom() >= 8.5) || !!selectedVillageId;
      document.querySelectorAll<HTMLElement>('.marker-3d-shelter-badge').forEach(el => {
        el.style.display = (layers.shelters && isZoomedIn) ? 'block' : 'none';
      });
      document.querySelectorAll<HTMLElement>('.marker-3d-sensor-badge').forEach(el => {
        el.style.display = (layers.sensors && isZoomedIn) ? 'block' : 'none';
      });
      document.querySelectorAll<HTMLElement>('.marker-3d-village-badge').forEach(el => {
        el.style.display = (layers.villageLabels && isZoomedIn) ? 'block' : 'none';
      });
    };

    map3d.on('zoom', updateMarkerZoomVis);
    updateMarkerZoomVis();

    return () => {
      map3d.off('zoom', updateMarkerZoomVis);
    };
  }, [layers, selectedVillageId]);

  // 4b. Camera fly-to for village selection and basin switching
  const lastFlown3DVillageIdRef = useRef<string | null>(null);
  const lastFlown3DBasinIdRef = useRef<string | null>(null);

  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || isDroneFlying || viewMode !== '3d') return;

    // 1. Village Selection FlyTo
    if (selectedVillageId && lastFlown3DVillageIdRef.current !== selectedVillageId) {
      lastFlown3DVillageIdRef.current = selectedVillageId;
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
      return;
    }

    // 2. All-India National Overview (when selectedVillageId is null)
    if (!selectedVillageId) {
      if (lastFlown3DVillageIdRef.current !== null) {
        lastFlown3DVillageIdRef.current = null;
        try {
          map3d.flyTo({
            center: [78.9, 22.5],
            zoom: 4.8,
            pitch: 0,
            bearing: 0,
            duration: 1800
          });
        } catch (err) {
          console.warn("MapLibre flyTo India overview error:", err);
        }
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
          setDroneWaypointDesc(wp.desc);
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
      setDroneWaypointDesc(null);
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    }

    return () => {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    };
  }, [isDroneFlying, selectedVillageId, selectedVillageData, villages]);

  const [droneWaypointDesc, setDroneWaypointDesc] = useState<string | null>(null);

  const handleCameraPreset = (targetPitch: number, targetBearing: number = 0) => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;
    map3d.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 800
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mapContainerRef}
        id="gis-map-3d"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />

      {/* 3D Tactical Camera Presets & Drone HUD Overlay */}
      <div className="hud-3d-overlay" style={{
        position: 'absolute',
        top: 60,
        left: 14,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
        pointerEvents: 'none'
      }}>
        {/* Drone Flight Waypoint Banner */}
        {isDroneFlying && droneWaypointDesc && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.9)',
            border: '1px solid #ffffff',
            borderRadius: '9999px',
            padding: '4px 14px',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'pulse-ring 1.5s infinite',
            pointerEvents: 'auto'
          }}>
            <span>🚁 DRONE RECON TARGET:</span>
            <span>{droneWaypointDesc}</span>
          </div>
        )}

        {/* Tactical Angle Presets Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '9999px',
          padding: '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'auto'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-cyan)', paddingLeft: '4px' }}>
            3D ANGLE:
          </span>
          <button
            onClick={() => handleCameraPreset(0, 0)}
            style={{
              background: '#090d16',
              border: '1px solid var(--border-color)',
              color: '#cbd5e1',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Birds-Eye Orthographic Plan View (0° Pitch)"
          >
            🦅 Topo (0°)
          </button>
          <button
            onClick={() => handleCameraPreset(58, -25)}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Standard Himalayan Valley Gorge Incline (58° Pitch)"
          >
            ⛰️ Valley (58°)
          </button>
          <button
            onClick={() => handleCameraPreset(65, 15)}
            style={{
              background: '#090d16',
              border: '1px solid var(--border-color)',
              color: '#cbd5e1',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Steep Mountain Face Incline (65° Pitch)"
          >
            🚁 Recon (65°)
          </button>
        </div>
      </div>
    </div>
  );
};