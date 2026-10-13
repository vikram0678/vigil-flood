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

// Helper: Generate a high-resolution elevation & terrain-conforming curved river flood corridor
// Replaces the crude rectangular box with an organic meandering river surge that hugs mountain contours
function generateCurvedRiverFloodPolygon(
  stream: [number, number][], // Array of [lat, lng]
  dynamicStage: number,
  waveTime: number
): [number, number][] {
  if (!stream || stream.length < 2) return [];

  // Step 1: Smoothly interpolate along river center path
  const smoothedPath: [number, number][] = [];
  const SAMPLES_PER_SEGMENT = 6;

  for (let i = 0; i < stream.length - 1; i++) {
    const p0 = stream[Math.max(0, i - 1)];
    const p1 = stream[i];
    const p2 = stream[i + 1];
    const p3 = stream[Math.min(stream.length - 1, i + 2)];

    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT;
      const t2 = t * t;
      const t3 = t2 * t;

      // Catmull-Rom spline interpolation for smooth river meanders
      const lat = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      const lng = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );
      smoothedPath.push([lat, lng]);
    }
  }
  smoothedPath.push(stream[stream.length - 1]);

  const numPts = smoothedPath.length;
  const leftBank: [number, number][] = [];
  const rightBank: [number, number][] = [];

  const cosLat = Math.cos((smoothedPath[0][0] * Math.PI) / 180);

  // Step 2: Compute perpendicular banks with terrain valley-widening & downstream wave propagation
  for (let i = 0; i < numPts; i++) {
    const prev = smoothedPath[Math.max(0, i - 1)];
    const next = smoothedPath[Math.min(numPts - 1, i + 1)];

    // Tangent flow vector along riverbed gradient
    const dLat = next[0] - prev[0];
    const dLng = next[1] - prev[1];

    const dY = dLat;
    const dX = dLng * cosLat;
    const len = Math.hypot(dX, dY) || 0.00001;

    // 90° Perpendicular Normal Vector (pointing toward riverbanks)
    const normX = -dY / len;
    const normY = dX / len;

    const normLng = normX / cosLat;
    const normLat = normY;

    // Valley profile: Wider in the central village basin, narrower in rocky entry/exit gorges
    const valleyPosition = i / numPts;
    const basinSpread = 1.0 + 0.85 * Math.sin(valleyPosition * Math.PI);

    // Dynamic water level surge factor
    const stageExpansion = 1.0 + Math.max(0, (dynamicStage - 1.2) * 0.55);

    // Downstream traveling surge wave crest (phase delay along downstream distance)
    const waveSurge = 1.0 + 0.12 * Math.sin(waveTime / 400 - valleyPosition * 5.0);

    // Base half-width in degrees (~35m base channel, swells to ~180m+ during flood surge)
    const halfWidth = 0.00032 * basinSpread * stageExpansion * waveSurge;

    const centerLat = smoothedPath[i][0];
    const centerLng = smoothedPath[i][1];

    // Left & Right Bank Coordinates [lng, lat]
    leftBank.push([
      centerLng + normLng * halfWidth,
      centerLat + normLat * halfWidth
    ]);
    rightBank.push([
      centerLng - normLng * halfWidth,
      centerLat - normLat * halfWidth
    ]);
  }

  // Step 3: Construct closed watertight polygon (Left Bank -> Right Bank reversed -> Closed)
  return [...leftBank, ...rightBank.reverse(), leftBank[0]];
}

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
  const [isSurgeEnabled, setIsSurgeEnabled] = useState<boolean>(true);
  const [isWaveSimulationRunning, setIsWaveSimulationRunning] = useState<boolean>(false);
  const lastAnimatedVillageIdRef = useRef<string | null>(null);
  const currentBasemapLayerIdRef = useRef<string>('hybrid-satellite-layer');
  const currentBasemapSourceIdRef = useRef<string>('hybrid-satellite-source');

  // Real-time hydrodynamic surge state (drives continuous 3D vertical rise & horizontal valley spread)
  const activeFloodRef = useRef<{
    redPts: [number, number][];
    cLat: number;
    cLng: number;
    baseStage: number;
    targetStage: number;
    isSurging: boolean;
    riverStream: [number, number][] | null;
  }>({
    redPts: [],
    cLat: 0,
    cLng: 0,
    baseStage: 1.8,
    targetStage: 1.8,
    isSurging: true,
    riverStream: null
  });

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

      // 3D Flood water / Dynamic Inundation Water Mesh Source
      map3d.addSource('3d-flood-water-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // 3D Water Volume Extrusion (Rises realistically along mountain elevation)
      map3d.addLayer({
        id: '3d-flood-water-extrude',
        type: 'fill-extrusion',
        source: '3d-flood-water-source',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['>=', ['coalesce', ['get', 'water_level'], 1.8], 3.0],
            '#dc2626',
            ['>=', ['coalesce', ['get', 'water_level'], 1.8], 2.0],
            '#0284c7',
            '#0ea5e9'
          ],
          'fill-extrusion-height': ['coalesce', ['get', 'extrude_height'], 15],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.72
        }
      });

      // Ground Inundation Footprint
      map3d.addLayer({
        id: '3d-flood-water-fill',
        type: 'fill',
        source: '3d-flood-water-source',
        paint: {
          'fill-color': [
            'case',
            ['>=', ['coalesce', ['get', 'water_level'], 1.8], 3.0],
            '#ef4444',
            ['>=', ['coalesce', ['get', 'water_level'], 1.8], 2.0],
            '#0284c7',
            '#38bdf8'
          ],
          'fill-opacity': 0.50
        }
      });

      // Shimmering Shoreline Boundary Line
      map3d.addLayer({
        id: '3d-flood-water-shoreline',
        type: 'line',
        source: '3d-flood-water-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.5,
          'line-opacity': 0.85
        }
      });

      // 3D IMD Doppler Weather Radar Reflectivity Source & Layers
      map3d.addSource('3d-radar-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map3d.addLayer({
        id: '3d-radar-fill',
        type: 'fill',
        source: '3d-radar-source',
        paint: {
          'fill-color': ['coalesce', ['get', 'radar_color'], '#f59e0b'],
          'fill-opacity': 0.40
        }
      });

      map3d.addLayer({
        id: '3d-radar-outline',
        type: 'line',
        source: '3d-radar-source',
        paint: {
          'line-color': ['coalesce', ['get', 'radar_color'], '#f59e0b'],
          'line-width': 2,
          'line-opacity': 0.75,
          'line-dasharray': [3, 2]
        }
      });

      // 3D Evacuation Routes Source & Layers
      map3d.addSource('3d-route-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Evacuation Route Casing (dark underlay for contrast against mountain terrain)
      map3d.addLayer({
        id: '3d-route-casing',
        type: 'line',
        source: '3d-route-source',
        paint: {
          'line-color': [
            'case',
            ['get', 'is_safe'],
            '#064e3b',
            '#7f1d1d'
          ],
          'line-width': 7,
          'line-opacity': 0.85
        }
      });

      // Evacuation Route Core Polyline
      map3d.addLayer({
        id: '3d-route-line',
        type: 'line',
        source: '3d-route-source',
        paint: {
          'line-color': [
            'case',
            ['get', 'is_safe'],
            '#34d399',
            '#f87171'
          ],
          'line-width': 4,
          'line-opacity': 0.98,
          'line-dasharray': [3, 2]
        }
      });

      // 3D Stream source (shared by all flow layers)
      map3d.addSource('3d-stream-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Layer 1: Deep channel bed (dark, wide, subtle)
      map3d.addLayer({
        id: '3d-stream-bed-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#0c4a6e',
          'line-width': 10,
          'line-opacity': 0.5,
          'line-blur': 3
        }
      });

      // Layer 2: Core water body (solid mid-blue)
      map3d.addLayer({
        id: '3d-stream-line-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 7,
          'line-opacity': 0.88
        }
      });

      // Layer 3: Animated downstream flow dashes (white, moves along the path)
      map3d.addLayer({
        id: '3d-stream-flow-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#bae6fd',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [0, 4, 3]
        }
      });

      // Layer 4: Fast surface particle streaks (very thin, bright, rapid dash)
      map3d.addLayer({
        id: '3d-stream-pulse-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.65,
          'line-dasharray': [1, 6]
        }
      });

      // Animated water flow: cycle through MapLibre dash-array offsets to create
      // a moving "flowing downstream" effect at ~60fps. This uses NO extra libraries
      // and runs entirely on MapLibre's existing WebGL pipeline.
      //
      // How it works: By smoothly transitioning between dash-array patterns in a
      // pre-computed sequence, the dashes appear to travel along the line geometry.
      // Two layers animate at different speeds to simulate depth — slow mid-flow
      // (Layer 3) and fast surface turbulence (Layer 4).
      let flowStep = 0;
      const dashSeqFlow = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
        [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
        [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2],
        [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]
      ];
      const dashSeqPulse = [
        [1, 6], [0.5, 6, 0.5, 0], [0, 6, 1, 0], [0, 5.5, 1, 0.5],
        [0, 5, 1, 1], [0, 4.5, 1, 1.5], [0, 4, 1, 2],
        [0, 3.5, 1, 2.5], [0, 3, 1, 3], [0, 2.5, 1, 3.5],
        [0, 2, 1, 4], [0, 1.5, 1, 4.5], [0, 1, 1, 5], [0, 0.5, 1, 5.5]
      ];

      const animateFlow = () => {
        flowStep++;
        // Main flow dashes (slower — simulate mid-depth current)
        if (map3d.getLayer('3d-stream-flow-layer') && flowStep % 3 === 0) {
          const idx = Math.floor(flowStep / 3) % dashSeqFlow.length;
          try {
            map3d.setPaintProperty('3d-stream-flow-layer', 'line-dasharray', dashSeqFlow[idx]);
          } catch (_) { }
        }
        // Surface particles (faster — simulate surface turbulence)
        if (map3d.getLayer('3d-stream-pulse-layer') && flowStep % 2 === 0) {
          const idx2 = Math.floor(flowStep / 2) % dashSeqPulse.length;
          try {
            map3d.setPaintProperty('3d-stream-pulse-layer', 'line-dasharray', dashSeqPulse[idx2]);
          } catch (_) { }
        }

        // Continuous 3D Flood Inundation Hydrodynamic Wave Surge
        // (Rises vertically in 3D + Meanders and spreads outward horizontally along the mountain valley floor)
        if (flowStep % 2 === 0 && map3d.getSource('3d-flood-water-source')) {
          const flood = activeFloodRef.current;
          const hasStream = Boolean(flood.riverStream && flood.riverStream.length >= 2);
          const hasPolygon = Boolean(flood.redPts && flood.redPts.length > 0);

          if (hasStream || hasPolygon) {
            // Smoothly track target stage (from What-If slider or wave surge scenario)
            if (Math.abs(flood.baseStage - flood.targetStage) > 0.01) {
              flood.baseStage += (flood.targetStage - flood.baseStage) * 0.07;
            }

            // Natural wave oscillation cycle (~2.8s period)
            const waveCycle = Math.sin(Date.now() / 450);
            const surgeAmp = flood.isSurging ? 0.35 + (flood.baseStage * 0.12) : 0;
            const dynamicStage = Math.max(0.6, flood.baseStage + waveCycle * surgeAmp);

            // 1. Generate Organic Curved River Flood Polygon or scale fallback polygon
            let expandedCoords: [number, number][] = [];
            if (hasStream && flood.riverStream) {
              expandedCoords = generateCurvedRiverFloodPolygon(flood.riverStream, dynamicStage, Date.now());
            } else {
              const expansionFactor = 1.0 + Math.max(0, (dynamicStage - 1.2) * 0.22);
              expandedCoords = flood.redPts.map(pt => {
                const dLat = pt[0] - flood.cLat;
                const dLng = pt[1] - flood.cLng;
                return [flood.cLng + dLng * expansionFactor, flood.cLat + dLat * expansionFactor];
              });
              if (expandedCoords.length > 0) {
                expandedCoords.push(expandedCoords[0]);
              }
            }

            // 2. Vertical 3D Extrusion Height (visibly climbs up & down mountain slopes)
            const extrudeHeight = Math.max(14, dynamicStage * 22);

            try {
              if (expandedCoords.length > 2) {
                (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
                  type: 'FeatureCollection',
                  features: [{
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [expandedCoords] },
                    properties: {
                      water_level: dynamicStage,
                      extrude_height: extrudeHeight
                    }
                  }]
                });
              }

              // Dynamic water opacity shimmer and foaming shoreline pulse
              if (map3d.getLayer('3d-flood-water-shoreline')) {
                const shorelinePulse = 0.55 + 0.40 * Math.abs(waveCycle);
                map3d.setPaintProperty('3d-flood-water-shoreline', 'line-opacity', shorelinePulse);
                map3d.setPaintProperty('3d-flood-water-shoreline', 'line-width', 2.0 + 1.5 * Math.abs(waveCycle));
              }
              if (map3d.getLayer('3d-flood-water-extrude')) {
                const extrudeOpacity = 0.68 + 0.12 * Math.abs(waveCycle);
                map3d.setPaintProperty('3d-flood-water-extrude', 'fill-extrusion-opacity', extrudeOpacity);
              }

              // Dynamic stream line width scaling in lockstep with the surge
              if (map3d.getLayer('3d-stream-bed-layer')) {
                map3d.setPaintProperty('3d-stream-bed-layer', 'line-width', Math.max(10, 8 + dynamicStage * 3));
              }
              if (map3d.getLayer('3d-stream-line-layer')) {
                map3d.setPaintProperty('3d-stream-line-layer', 'line-width', Math.max(6, 5 + dynamicStage * 2));
              }
            } catch (_) { }
          }
        }

        animFrameRef.current = requestAnimationFrame(animateFlow);
      };
      animateFlow();
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

  // 2. Basemap 3D Switcher (Atomic Dynamic Source/Layer Swap)
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    const apply3DBasemap = () => {
      const cfg = BASEMAP_3D_SOURCES[basemap3D] || BASEMAP_3D_SOURCES.google_hybrid;
      console.log(`🗺️ [3D BASEMAP SWITCH] Applying "${basemap3D}" (${cfg.name})`, cfg.tiles);

      // Unique timestamped IDs guarantee zero layer/source name collisions
      const newSourceId = `basemap-source-${Date.now()}`;
      const newLayerId = `basemap-layer-${Date.now()}`;

      try {
        map3d.addSource(newSourceId, {
          type: 'raster',
          tiles: cfg.tiles,
          tileSize: cfg.tileSize || 256,
          maxzoom: cfg.maxzoom || 20,
          attribution: cfg.attribution
        });

        // Insert underneath contours, river stream, and flood polygons
        const beforeLayer = map3d.getLayer('3d-topo-contours-line')
          ? '3d-topo-contours-line'
          : (map3d.getLayer('3d-stream-bed-layer')
            ? '3d-stream-bed-layer'
            : (map3d.getLayer('3d-flood-water-fill') ? '3d-flood-water-fill' : undefined));

        map3d.addLayer({
          id: newLayerId,
          type: 'raster',
          source: newSourceId,
          minzoom: 0,
          maxzoom: 22
        }, beforeLayer);

        // Safely detach and remove previous layer and source
        const oldLayerId = currentBasemapLayerIdRef.current;
        const oldSourceId = currentBasemapSourceIdRef.current;

        if (oldLayerId && map3d.getLayer(oldLayerId)) {
          map3d.removeLayer(oldLayerId);
        }
        if (oldSourceId && map3d.getSource(oldSourceId)) {
          map3d.removeSource(oldSourceId);
        }

        currentBasemapLayerIdRef.current = newLayerId;
        currentBasemapSourceIdRef.current = newSourceId;
      } catch (err) {
        console.warn("3D basemap switch error:", err);
      }
    };

    if (map3d.isStyleLoaded() || map3d.getStyle()) {
      apply3DBasemap();
    } else {
      map3d.once('load', apply3DBasemap);
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

    const v = villages.find(x => x.id === selectedVillageId) ||
      (selectedVillageData?.village?.id === selectedVillageId ? selectedVillageData.village : null);
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
      if (map3d.getSource('3d-route-source')) {
        (map3d.getSource('3d-route-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      return;
    }

    const v = selectedVillageData.village;

    // Set River Stream Line geometry
    if (v.river_stream && map3d.getSource('3d-stream-source')) {
      const streamGeoJson = v.river_stream.map(pt => [pt[1], pt[0]]);
      (map3d.getSource('3d-stream-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: streamGeoJson },
          properties: { stream_width: 7 }
        }]
      });
    }

    // Centroid calculation for horizontal valley expansion
    const redPts = v.hazard_zones?.red_inundation_polygon || v.inundation_polygon;
    let cLat = 0;
    let cLng = 0;
    if (redPts && redPts.length > 0) {
      cLat = redPts.reduce((acc, p) => acc + p[0], 0) / redPts.length;
      cLng = redPts.reduce((acc, p) => acc + p[1], 0) / redPts.length;
    }

    const targetStage = simulation.water || 1.8;
    const isNewVillage = lastAnimatedVillageIdRef.current !== v.id;
    lastAnimatedVillageIdRef.current = v.id;

    const hasStream = Boolean(v.river_stream && v.river_stream.length > 1);
    const hasPolygon = Boolean(redPts && redPts.length > 0);

    if (hasStream || hasPolygon) {
      activeFloodRef.current = {
        redPts: redPts || [],
        cLat,
        cLng,
        baseStage: isNewVillage ? Math.max(0.6, targetStage * 0.4) : activeFloodRef.current.baseStage,
        targetStage,
        isSurging: isSurgeEnabled,
        riverStream: hasStream ? (v.river_stream as [number, number][]) : null
      };
    } else {
      activeFloodRef.current.redPts = [];
      activeFloodRef.current.riverStream = null;
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

    // 4. Update 🛣️ Evacuation Routes Polyline
    const routes = v.evacuation_routes || v.routes || [];
    const shelters = v.safe_shelters || v.shelters || [];
    if (map3d.getSource('3d-route-source')) {
      const routeFeatures: any[] = [];
      routes.forEach((r: any, rIdx: number) => {
        const isSafe = r.safety_score !== undefined ? r.safety_score > 50 : (r.is_safe ?? true);
        const rawPath = r.path && r.path.length > 0 ? r.path : [[v.lat, v.lng], [shelters[0]?.lat || v.lat, shelters[0]?.lng || v.lng]];

        // Smooth coarse 2-3 point lines into mountain contour road curves
        let pathCoords = rawPath;
        if (rawPath.length >= 2 && rawPath.length <= 4) {
          const smoothed: [number, number][] = [];
          for (let i = 0; i < rawPath.length - 1; i++) {
            const p1 = rawPath[i];
            const p2 = rawPath[i + 1];
            const dLat = p2[0] - p1[0];
            const dLng = p2[1] - p1[1];
            const offsetSign = (i % 2 === 0 ? 1 : -1) * (rIdx % 2 === 0 ? 1 : -1);
            const midLat = (p1[0] + p2[0]) / 2 + (-dLng) * 0.18 * offsetSign;
            const midLng = (p1[1] + p2[1]) / 2 + (dLat) * 0.18 * offsetSign;
            
            smoothed.push(p1);
            smoothed.push([(p1[0] * 3 + midLat) / 4, (p1[1] * 3 + midLng) / 4]);
            smoothed.push([midLat, midLng]);
            smoothed.push([(midLat + p2[0] * 3) / 4, (midLng + p2[1] * 3) / 4]);
          }
          smoothed.push(rawPath[rawPath.length - 1]);
          pathCoords = smoothed;
        }

        // MapLibre uses [lng, lat]
        const lineGeoJson = pathCoords.map((pt: [number, number]) => [pt[1], pt[0]]);
        routeFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineGeoJson },
          properties: {
            name: r.name,
            is_safe: isSafe,
            safety_score: r.safety_score ?? (isSafe ? 90 : 25)
          }
        });
      });

      (map3d.getSource('3d-route-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: routeFeatures
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

    setVis('3d-flood-water-extrude', layers.hazardZones);
    setVis('3d-flood-water-fill', layers.hazardZones);
    setVis('3d-flood-water-shoreline', layers.hazardZones);
    setVis('3d-radar-fill', layers.dopplerRadar);
    setVis('3d-radar-outline', layers.dopplerRadar);
    setVis('3d-orange-slope-fill', layers.hazardZones);
    setVis('3d-green-safe-fill', layers.hazardZones);
    setVis('3d-route-casing', layers.routes && layers.shelters);
    setVis('3d-route-line', layers.routes && layers.shelters);
    setVis('3d-stream-bed-layer', layers.streams);
    setVis('3d-stream-line-layer', layers.streams);
    setVis('3d-stream-flow-layer', layers.streams);
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

  // Synchronize 3D Doppler Radar Reflectivity Layer from Radar Player events
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    const handleRadarFrame = (e: any) => {
      if (!layers.dopplerRadar) return;
      const frame = e.detail?.frame;
      const frameIdx = e.detail?.frameIndex ?? 3;
      if (!frame || !map3d.getSource('3d-radar-source')) return;

      const offsetLat = (frameIdx - 3) * 0.04;
      const offsetLng = (frameIdx - 3) * 0.05;
      const dbz = frame.peakDbz || 50;

      const radarColor = dbz >= 65 ? '#c026d3' : dbz >= 55 ? '#ef4444' : dbz >= 45 ? '#f97316' : dbz >= 35 ? '#eab308' : '#10b981';

      const stormCenters = [
        { lat: 31.70 + offsetLat, lng: 77.05 + offsetLng, radius: 0.16 + (dbz / 400) }, // Beas Mandi/Kullu
        { lat: 30.55 + offsetLat * 0.8, lng: 79.50 + offsetLng * 0.8, radius: 0.14 + (dbz / 450) }, // Alaknanda Chamoli
        { lat: 27.60 + offsetLat * 1.2, lng: 88.55 + offsetLng * 1.2, radius: 0.15 + (dbz / 420) }, // Teesta Sikkim
        { lat: 11.60 + offsetLat * 0.5, lng: 76.15 + offsetLng * 0.5, radius: 0.13 + (dbz / 500) }  // Wayanad Kerala
      ];

      const features = stormCenters.map((sc, i) => {
        const ring = [];
        const numPoints = 16;
        for (let a = 0; a <= numPoints; a++) {
          const angle = (a / numPoints) * 2 * Math.PI;
          const wobble = 1.0 + 0.15 * Math.sin(angle * 3 + frameIdx);
          const r = sc.radius * wobble;
          ring.push([sc.lng + r * Math.cos(angle) * 1.2, sc.lat + r * Math.sin(angle)]);
        }
        return {
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: { dbz, radar_color: radarColor, basin_id: i }
        };
      });

      (map3d.getSource('3d-radar-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features
      });
    };

    window.addEventListener('imd-radar-frame-change', handleRadarFrame);
    return () => window.removeEventListener('imd-radar-frame-change', handleRadarFrame);
  }, [layers.dopplerRadar]);

  // 4b. Camera fly-to for village selection and basin switching
  const lastFlown3DVillageIdRef = useRef<string | null>(null);
  const lastFlown3DBasinIdRef = useRef<string | null>(null);

  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || isDroneFlying || viewMode !== '3d') return;

    // 1. Village Selection FlyTo
    if (selectedVillageId && lastFlown3DVillageIdRef.current !== selectedVillageId) {
      lastFlown3DVillageIdRef.current = selectedVillageId;
      const v = villages.find(x => x.id === selectedVillageId) ||
        (selectedVillageData?.village?.id === selectedVillageId ? selectedVillageData.village : null);
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

  const triggerFloodWaveSimulation = () => {
    if (isWaveSimulationRunning) return;
    setIsWaveSimulationRunning(true);
    setIsSurgeEnabled(true);
    activeFloodRef.current.isSurging = true;

    // Phase 1: Rapid 4.6m breach surge
    activeFloodRef.current.baseStage = 1.0;
    activeFloodRef.current.targetStage = 4.6;

    // Phase 2: Peak hold (3s) then recede back to baseline
    setTimeout(() => {
      setTimeout(() => {
        activeFloodRef.current.targetStage = simulation.water || 1.8;
        setIsWaveSimulationRunning(false);
      }, 3000);
    }, 4500);
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
        top: 14,
        left: 330,
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

        {/* Tactical Controls & Hydrodynamic Wave Surge Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          pointerEvents: 'auto'
        }}>
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
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)'
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

          {/* Dynamic 3D Flood Inundation Surge Controls */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.88)',
            border: isWaveSimulationRunning ? '1px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '9999px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            boxShadow: isWaveSimulationRunning ? '0 0 15px rgba(239, 68, 68, 0.7)' : '0 4px 20px rgba(0, 0, 0, 0.7)'
          }}>
            <button
              onClick={() => {
                const next = !isSurgeEnabled;
                setIsSurgeEnabled(next);
                activeFloodRef.current.isSurging = next;
              }}
              style={{
                background: isSurgeEnabled ? 'rgba(56, 189, 248, 0.22)' : '#090d16',
                border: isSurgeEnabled ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                color: isSurgeEnabled ? '#38bdf8' : '#94a3b8',
                borderRadius: '9999px',
                padding: '2px 9px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Toggle continuous hydrodynamic 3D wave surge undulation"
            >
              <span>🌊</span>
              <span>Surge Wave: <b>{isSurgeEnabled ? 'LIVE' : 'PAUSED'}</b></span>
            </button>

            <button
              onClick={triggerFloodWaveSimulation}
              disabled={isWaveSimulationRunning}
              style={{
                background: isWaveSimulationRunning ? '#dc2626' : 'rgba(239, 68, 68, 0.22)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: isWaveSimulationRunning ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Simulate full 3D flash flood surge lifecycle (1.0m baseflow to 4.6m peak breach)"
            >
              <span>{isWaveSimulationRunning ? '🚨 SIMULATING BREACH...' : '⚡ Simulate Flood Wave (1m ➔ 4.6m)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};