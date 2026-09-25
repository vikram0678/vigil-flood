import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useFlood } from '../../context/FloodContext';
import { BASEMAP_2D_TILES, RISK_COLORS } from '../../constants';

const HYDRO_STREAM_ARROW_SVG = `
  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" class="hydro-vector-svg">
    <path d="M16 28 L16 4" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M7 13 L16 3 L25 13" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 20 L16 13 L22 20" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  </svg>
`;

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

function getDownhillFlowArrowPoints(streamCoords: [number, number][]) {
  if (!streamCoords || streamCoords.length < 2) return [];
  const arrowPoints: { lat: number; lng: number; bearing: number }[] = [];

  for (let i = 0; i < streamCoords.length - 1; i++) {
    const p1 = streamCoords[i];
    const p2 = streamCoords[i + 1];
    const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);

    [0.30, 0.70].forEach(ratio => {
      const lat = p1[0] + (p2[0] - p1[0]) * ratio;
      const lng = p1[1] + (p2[1] - p1[1]) * ratio;
      arrowPoints.push({ lat, lng, bearing });
    });
  }
  return arrowPoints;
}

export const GISMap2D: React.FC = () => {
  const {
    villages,
    selectedVillageId,
    selectedVillageData,
    selectVillage,
    viewMode,
    basemap2D,
    layers,
    activeBasin,
    activeBasinId
  } = useFlood();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups refs
  const hexGridLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const hazardLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const streamLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const shelterLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const sensorLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const contoursLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const dopplerLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const hexPolygonsRef = useRef<Record<string, L.Polygon>>({});

  // Auto-invalidateSize and center camera whenever viewMode switches to 2D
  useEffect(() => {
    if (viewMode === '2d' && mapInstanceRef.current) {
      const t1 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 50);

      const t2 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewMode]);

  // 1. Initialize Leaflet Map Instance ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const indiaCenterCoords: [number, number] = [22.5, 78.9];
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 4, // Full India subcontinent overview allowed
      maxZoom: 18
    }).setView(indiaCenterCoords, 5);

    mapInstanceRef.current = map;
    (window as any).leafletMap = map;

    // Reset and attach fresh layer groups to active map
    hexGridLayerRef.current = L.layerGroup().addTo(map);
    hazardLayerRef.current = L.layerGroup().addTo(map);
    streamLayerRef.current = L.layerGroup().addTo(map);
    shelterLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    sensorLayerRef.current = L.layerGroup().addTo(map);
    contoursLayerRef.current = L.layerGroup().addTo(map);
    markersRef.current = {};
    hexPolygonsRef.current = {};
    renderedVillageIdRef.current = null;
    lastFlownVillageIdRef.current = null;

    // Doppler Radar Tile Layer (RainViewer Open Precipitation)
    dopplerLayerRef.current = L.tileLayer(
      'https://tilecache.rainviewer.com/v2/radar/nowcast_20240925/256/{z}/{x}/{y}/2/1_1.png',
      { opacity: 0.65, maxZoom: 18, zIndex: 400 }
    );

    // Set initial basemap tile layer
    const initialCfg = BASEMAP_2D_TILES[basemap2D] || BASEMAP_2D_TILES.google_floodhub;
    baseLayerRef.current = L.tileLayer(initialCfg.url, initialCfg.options).addTo(map);

    L.control.scale({ position: 'bottomleft', metric: true, imperial: true, maxWidth: 100 }).addTo(map);

    // Continuous container resize observer to prevent blank/grey map on layout shifts
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    // Click-to-Get DEM Elevation Spot Analysis Popup
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const popup = L.popup({
        closeButton: false,
        autoClose: true,
        closeOnClick: true,
        className: 'custom-elevation-popup'
      })
        .setLatLng([lat, lng])
        .setContent(`
          <div class="elevation-popup-card">
            <div class="elev-popup-header">
              <div class="elev-popup-title">📡 Querying 30m DEM...</div>
              <button onclick="window.leafletMap?.closePopup();" class="elev-close-btn" title="Close Popup">&times;</button>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); padding:4px 0;">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
          </div>
        `)
        .openOn(map);

      try {
        const res = await fetch(`/api/terrain/elevation?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        popup.setContent(`
          <div class="elevation-popup-card">
            <div class="elev-popup-header">
              <div class="elev-popup-title">⛰️ Topographic Spot Analysis</div>
              <button onclick="window.leafletMap?.closePopup();" class="elev-close-btn" title="Close Popup">&times;</button>
            </div>
            <div class="elev-popup-grid">
              <div>
                <div class="elev-popup-label">ELEVATION (DEM)</div>
                <div class="elev-popup-val">${data.elevation_m} m</div>
              </div>
              <div>
                <div class="elev-popup-label">TERRAIN ZONE</div>
                <div style="font-size:0.75rem; font-weight:700; color:${data.zone_color};">${data.terrain_zone}</div>
              </div>
            </div>
            <div class="elev-popup-coords">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">Source: ${data.source}</div>
          </div>
        `);
      } catch (err) {
        console.error("DEM fetch error:", err);
      }
    });

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      baseLayerRef.current = null;
      markersRef.current = {};
      hexPolygonsRef.current = {};
      renderedVillageIdRef.current = null;
      lastFlownVillageIdRef.current = null;
    };
  }, []);

  // 2. Basemap Switcher Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const cfg = BASEMAP_2D_TILES[basemap2D] || BASEMAP_2D_TILES.google_floodhub;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    baseLayerRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);

    if (mapContainerRef.current) {
      if (cfg.isDarkFilter) {
        mapContainerRef.current.classList.add('map-dark-filter');
      } else {
        mapContainerRef.current.classList.remove('map-dark-filter');
      }
    }
  }, [basemap2D]);

  // 3. Update Village Markers (Google Flood Hub 5-Tier Threat Style)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || villages.length === 0) return;

    villages.forEach(v => {
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';
      const isDanger = v.risk_level === 'HIGH' || v.risk_level === 'DANGER';
      const radius = isCritical ? 14 : (isDanger ? 12 : 10);

      if (!markersRef.current[v.id]) {
        const circle = L.circleMarker([v.lat, v.lng], {
          radius,
          fillColor: color,
          color: '#ffffff',
          weight: 2.5,
          opacity: 1.0,
          fillOpacity: 0.95
        }).addTo(map);

        circle.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; text-align:center; padding:2px 4px;">
            <div style="font-weight:700; font-size:0.85rem; color:#f8fafc;">${v.name}</div>
            <div style="font-size:0.75rem; color:${color}; font-weight:600; margin-top:2px;">
              ${isCritical ? '🔴 Extreme Threat' : (isDanger ? '🟠 Danger Zone' : (v.risk_level === 'MODERATE' ? '🟡 Flood Warning' : '🟢 Normal Level'))} (${v.risk_percentage}%)
            </div>
          </div>
        `, {
          permanent: false,
          direction: 'top'
        });

        circle.on('click', () => selectVillage(v.id));
        markersRef.current[v.id] = circle;
      } else {
        markersRef.current[v.id].setStyle({
          fillColor: color,
          radius,
          weight: 2.5
        });
      }
    });

    // Render Hexagonal Risk Grid (Google Flood Hub Style) in-place
    villages.forEach(v => {
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      if (!hexPolygonsRef.current[v.id]) {
        const cellRadius = 0.015;
        const hexPoints: [number, number][] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + (Math.PI / 6);
          hexPoints.push([
            v.lat + cellRadius * Math.sin(angle),
            v.lng + cellRadius * Math.cos(angle) * 1.15
          ]);
        }
        const poly = L.polygon(hexPoints, {
          color: color,
          weight: 1.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: 0.22,
          dashArray: '4, 4'
        }).addTo(hexGridLayerRef.current);
        hexPolygonsRef.current[v.id] = poly;
      } else {
        hexPolygonsRef.current[v.id].setStyle({
          color: color,
          fillColor: color
        });
      }
    });
  }, [villages, selectVillage]);

  // 4. Update Overlays for Selected Village or Entire Basin (Hazard Zones, Shelters, Routes, Streams, Sensors)
  const renderedVillageIdRef = useRef<string | null>(null);
  useEffect(() => {
    hazardLayerRef.current.clearLayers();
    streamLayerRef.current.clearLayers();
    shelterLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();
    sensorLayerRef.current.clearLayers();

    if (!selectedVillageData) {
      renderedVillageIdRef.current = null;

      // Populate basin-wide Safe Refuge, IoT Sensors, River Streams, and Inundation Polygons
      villages.forEach(v => {
        // Basin-wide safe shelter pins
        const shelters = v.safe_shelters || v.shelters || [];
        if (shelters.length > 0) {
          shelters.forEach(s => {
            const shelterMarker = L.marker([s.lat, s.lng], {
              icon: L.divIcon({
                className: "custom-shelter-pin",
                html: `<div class="shelter-pin-badge">⛺</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              })
            });
            shelterMarker.bindTooltip(`
              <div style="font-family:'Outfit',sans-serif; padding:2px;">
                <div style="font-weight:700; color:#10b981;">⛺ ${s.name}</div>
                <div style="font-size:11px; color:#cbd5e1;">Capacity: <b>${s.capacity}</b> | Elev: <b>${s.elevation_m}m</b></div>
                <div style="font-size:10px; color:#34d399; margin-top:2px;">Status: SAFE HIGH RIDGE REFUGE</div>
              </div>
            `, { sticky: true, direction: "top" });
            shelterLayerRef.current.addLayer(shelterMarker);
          });
        } else {
          const shelterMarker = L.marker([v.lat + 0.007, v.lng + 0.006], {
            icon: L.divIcon({
              className: "custom-shelter-pin",
              html: `<div class="shelter-pin-badge">⛺</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })
          });
          shelterMarker.bindTooltip(`
            <div style="font-family:'Outfit',sans-serif; padding:2px;">
              <div style="font-weight:700; color:#10b981;">⛺ ${v.name} High Ridge Refuge</div>
              <div style="font-size:11px; color:#cbd5e1;">Capacity: <b>250</b> | Elev: <b>${v.elevation_m + 85}m</b></div>
              <div style="font-size:10px; color:#34d399; margin-top:2px;">Status: SAFE HIGH RIDGE REFUGE</div>
            </div>
          `, { sticky: true, direction: "top" });
          shelterLayerRef.current.addLayer(shelterMarker);
        }

        // Basin-wide IoT sensor pins
        const sensors = v.sensor_locations || [];
        if (sensors.length > 0) {
          sensors.forEach(sens => {
            const sensorMarker = L.marker([sens.lat, sens.lng], {
              icon: L.divIcon({
                className: "custom-sensor-pin",
                html: `<div class="sensor-pin-badge">📡</div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })
            });
            sensorMarker.bindTooltip(`
              <div style="font-family:'Outfit',sans-serif; padding:2px;">
                <div style="font-weight:700; color:#38bdf8;">📡 ${sens.type} Gauge</div>
                <div style="font-size:11px; color:#cbd5e1;">ID: <code>${sens.id}</code></div>
                <div style="font-size:10px; color:#10b981;">Status: LIVE TELEMETRY STREAMING</div>
              </div>
            `, { sticky: true, direction: "top" });
            sensorLayerRef.current.addLayer(sensorMarker);
          });
        } else {
          const sensorMarker = L.marker([v.lat - 0.005, v.lng - 0.005], {
            icon: L.divIcon({
              className: "custom-sensor-pin",
              html: `<div class="sensor-pin-badge">📡</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            })
          });
          sensorMarker.bindTooltip(`
            <div style="font-family:'Outfit',sans-serif; padding:2px;">
              <div style="font-weight:700; color:#38bdf8;">📡 ${v.name} CWC River Gauge</div>
              <div style="font-size:11px; color:#cbd5e1;">ID: <code>SENS-CWC-${v.id}</code></div>
              <div style="font-size:10px; color:#10b981;">Status: REAL-TIME TELEMETRY ACTIVE</div>
            </div>
          `, { sticky: true, direction: "top" });
          sensorLayerRef.current.addLayer(sensorMarker);
        }

        // Basin-wide River Streams
        if (v.river_stream && v.river_stream.length > 1) {
          const streamLine = L.polyline(v.river_stream, {
            color: "#0284c7",
            weight: 5,
            opacity: 0.85
          });
          streamLine.bindTooltip(`<b>🌊 ${v.name} River Drainage Stream</b><br>Flow Velocity: <b>28 km/h</b>`, { sticky: true });
          streamLayerRef.current.addLayer(streamLine);

          const pulseLine = L.polyline(v.river_stream, {
            color: "#ffffff",
            weight: 2.5,
            opacity: 0.9,
            className: "animated-stream-flow-pulse"
          });
          streamLayerRef.current.addLayer(pulseLine);
        }

        // Basin-wide Inundation Hazards
        const redPts = v.hazard_zones?.red_inundation_polygon || v.inundation_polygon;
        if (redPts && redPts.length > 0) {
          const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
          const poly = L.polygon(redPts, {
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 2,
            dashArray: "4, 4"
          });
          poly.bindTooltip(`<b>🔴 ${v.name} Inundation Zone</b><br>Threat Level: ${v.risk_level} (${v.risk_percentage}%)`, { sticky: true });
          hazardLayerRef.current.addLayer(poly);
        }
      });
      return;
    }
    const v = selectedVillageData.village;
    const isCritical = selectedVillageData.risk_analysis?.risk_level === 'CRITICAL' || selectedVillageData.risk_analysis?.risk_level === 'EXTREME';

    // Only rebuild layers when selected village changes, not on every telemetry pulse
    if (renderedVillageIdRef.current === v.id) return;
    renderedVillageIdRef.current = v.id;

    hazardLayerRef.current.clearLayers();
    streamLayerRef.current.clearLayers();
    shelterLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();
    sensorLayerRef.current.clearLayers();

    // A. Concentric 3-Tier Catchment Hazard Buffer Zones (🔴 Core, 🟠 Buffer, 🟡 Watch/🟢 Refuge)
    const zones = v.hazard_zones;
    if (zones) {
      // 🔴 RED ZONE: Core Inundation & Direct Debris Impact Zone
      if (zones.red_inundation_polygon && zones.red_inundation_polygon.length > 0) {
        const redPoly = L.polygon(zones.red_inundation_polygon, {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: isCritical ? 0.60 : 0.40,
          weight: isCritical ? 3.5 : 2.5,
          dashArray: isCritical ? "4, 6" : undefined,
          className: "hazard-polygon-red"
        });
        redPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:210px; padding:2px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:0.85rem; color:#ef4444; border-bottom:1px solid rgba(239,68,68,0.3); padding-bottom:3px; margin-bottom:4px;">
              <span>🔴</span> <span>CORE INUNDATION ZONE</span>
            </div>
            <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:4px;">
              <b>Direct Riverine Submergence & Active Landslide Footprint</b>
            </div>
            <div style="font-size:0.72rem; color:#fca5a5; background:rgba(239,68,68,0.15); padding:4px 6px; border-radius:4px; border-left:3px solid #ef4444;">
              🚨 <b>DIRECTIVE:</b> Compulsory immediate evacuation to designated high-ground refuge.
            </div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(redPoly);
      }

      // 🟠 ORANGE ZONE: Vulnerability & Access Road Cutoff Buffer (200m–500m)
      if (zones.orange_slope_polygon && zones.orange_slope_polygon.length > 0) {
        const orangePoly = L.polygon(zones.orange_slope_polygon, {
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.28,
          weight: 2,
          className: "hazard-polygon-orange"
        });
        orangePoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:210px; padding:2px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:0.85rem; color:#f97316; border-bottom:1px solid rgba(249,115,22,0.3); padding-bottom:3px; margin-bottom:4px;">
              <span>🟠</span> <span>VULNERABILITY BUFFER (200m–500m)</span>
            </div>
            <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:4px;">
              <b>Steep Gorge Shoulder & Secondary Debris / Cutoff Alert</b>
            </div>
            <div style="font-size:0.72rem; color:#fdba74; background:rgba(249,115,22,0.15); padding:4px 6px; border-radius:4px; border-left:3px solid #f97316;">
              ⚠️ <b>DIRECTIVE:</b> Prepare grab-bags, move vulnerable residents, avoid riverbanks.
            </div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(orangePoly);
      }

      // 🟢 GREEN / 🟡 YELLOW ZONE: Catchment Watch & Evacuation Staging Corridor (500m–1.5km)
      if (zones.green_safe_polygon && zones.green_safe_polygon.length > 0) {
        const greenPoly = L.polygon(zones.green_safe_polygon, {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.25,
          weight: 2,
          className: "hazard-polygon-green"
        });
        greenPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:210px; padding:2px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:0.85rem; color:#10b981; border-bottom:1px solid rgba(16,185,129,0.3); padding-bottom:3px; margin-bottom:4px;">
              <span>🟢</span> <span>SAFE REFUGE & WATCH CORRIDOR</span>
            </div>
            <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:4px;">
              <b>Elevated Ridge Refuge Ground (&gt;950m ASL)</b>
            </div>
            <div style="font-size:0.72rem; color:#86efac; background:rgba(16,185,129,0.15); padding:4px 6px; border-radius:4px; border-left:3px solid #10b981;">
              ✅ <b>DIRECTIVE:</b> Designated relief shelter & transit staging corridor.
            </div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(greenPoly);
      }
    } else if (v.inundation_polygon && v.inundation_polygon.length > 0) {
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      L.polygon(v.inundation_polygon, {
        color: color,
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.45,
        dashArray: '5, 5'
      }).addTo(hazardLayerRef.current);
    }

    // B. River Drainage Streams (🌊 Multi-layer Hydrodynamic Flow + Spaced Downhill Arrows)
    const stream = v.river_stream;
    if (stream && stream.length > 1) {
      // 1. Base Wide River Channel
      const baseStreamLine = L.polyline(stream, {
        color: "#0369a1",
        weight: 12,
        opacity: 0.85
      });
      baseStreamLine.bindTooltip(`<b>🌊 River Drainage Channel</b><br>Flow Direction: <b>Downhill into Gorge (${v.elevation_m}m)</b><br>Downstream Velocity: <b>25–35 km/h</b>`, { sticky: true });
      streamLayerRef.current.addLayer(baseStreamLine);

      // 2. Inner Hydrodynamic Core Track
      const coreStreamLine = L.polyline(stream, {
        color: "#06b6d4",
        weight: 6,
        opacity: 0.9
      });
      streamLayerRef.current.addLayer(coreStreamLine);

      // 3. Continuous Animated Downhill Pulse Line
      const pulseLine = L.polyline(stream, {
        color: "#ffffff",
        weight: 3.5,
        opacity: 0.95,
        className: "animated-stream-flow-pulse"
      });
      streamLayerRef.current.addLayer(pulseLine);

      // 4. Multiple Evenly-Spaced Downhill Flow Direction Arrows
      const flowArrows = getDownhillFlowArrowPoints(stream);
      flowArrows.forEach((pt, idx) => {
        const arrowMarker = L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: "hydro-arrow-marker-wrapper",
            html: `<div class="flow-stream-chevron" style="transform: rotate(${pt.bearing}deg);" title="Downhill River Flow #${idx + 1} (${Math.round(pt.bearing)}° Bearing)">${HYDRO_STREAM_ARROW_SVG}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          }),
          zIndexOffset: 900
        });
        streamLayerRef.current.addLayer(arrowMarker);
      });

      // 5. Central Flow Direction Pill Banner
      const midIdx = Math.floor(stream.length / 2);
      const midCoord = stream[midIdx];
      const flowBadgeMarker = L.marker(midCoord, {
        icon: L.divIcon({
          className: "flow-badge-wrapper",
          html: `<div class="flow-direction-2d-badge"><span>🌊 FLOOD FLOW: DOWNHILL GORGE</span><span class="flow-arrow-icon">➤➤➤</span></div>`,
          iconSize: [280, 34],
          iconAnchor: [140, 17]
        }),
        zIndexOffset: 1000
      });
      streamLayerRef.current.addLayer(flowBadgeMarker);

      // 6. Upstream & Downstream Badges
      const upperPt = stream[0];
      const lowerPt = stream[stream.length - 1];

      const upstreamBadge = L.marker(upperPt, {
        icon: L.divIcon({
          className: "endpoint-badge-wrapper",
          html: `<div class="hydro-endpoint-badge upstream">🏔️ Upstream Ridge ➔</div>`,
          iconSize: [160, 24],
          iconAnchor: [80, 28]
        }),
        zIndexOffset: 950
      });
      streamLayerRef.current.addLayer(upstreamBadge);

      const downstreamBadge = L.marker(lowerPt, {
        icon: L.divIcon({
          className: "endpoint-badge-wrapper",
          html: `<div class="hydro-endpoint-badge downstream">🌊 Gorge Basin (${v.elevation_m}m) ➔</div>`,
          iconSize: [160, 24],
          iconAnchor: [90, -8]
        }),
        zIndexOffset: 950
      });
      streamLayerRef.current.addLayer(downstreamBadge);
    }

    // C. Safe Relief Shelters (⛺)
    const shelters = v.safe_shelters || v.shelters || [];
    shelters.forEach(s => {
      const shelterMarker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: "custom-shelter-pin",
          html: `<div class="shelter-pin-badge">⛺</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      });
      shelterMarker.bindTooltip(`
        <div style="font-family:sans-serif; padding:2px;">
          <div style="font-weight:700; color:#10b981;">⛺ ${s.name}</div>
          <div style="font-size:11px; color:#cbd5e1;">Capacity: <b>${s.capacity}</b> people | Elev: <b>${s.elevation_m}m</b></div>
          <div style="font-size:10px; color:#34d399; margin-top:2px;">Status: DESIGNATED SAFE REFUGE</div>
        </div>
      `, { sticky: true, direction: "top" });
      shelterLayerRef.current.addLayer(shelterMarker);
    });

    // D. Evacuation Routes (🛣️)
    const routes = v.evacuation_routes || v.routes || [];
    routes.forEach(r => {
      const isSafe = r.safety_score !== undefined ? r.safety_score > 50 : (r.is_safe ?? true);
      const pathCoords = r.path || [[v.lat, v.lng], [shelters[0]?.lat || v.lat, shelters[0]?.lng || v.lng]];

      const routeLine = L.polyline(pathCoords, {
        color: isSafe ? "#10b981" : "#ef4444",
        weight: 3.5,
        dashArray: isSafe ? "6, 8" : "2, 6",
        opacity: 0.9
      });
      routeLine.bindTooltip(`<b>${r.name}</b><br>Status: ${r.status || (isSafe ? 'OPEN' : 'AVOID')}`, { sticky: true });
      routeLayerRef.current.addLayer(routeLine);
    });

    // E. Real-Time IoT Sensor Nodes (📡)
    const sensors = v.sensor_locations || [];
    sensors.forEach(sens => {
      const sensorMarker = L.marker([sens.lat, sens.lng], {
        icon: L.divIcon({
          className: "custom-sensor-pin",
          html: `<div class="sensor-pin-badge">📡</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      });
      const isRiverGauge = sens.type.toLowerCase().includes("river") || sens.id.includes("WTR");
      sensorMarker.bindTooltip(`
        <div style="font-family:sans-serif; padding:2px;">
          <div style="font-weight:700; color:#38bdf8;">📡 ${sens.type} Node</div>
          <div style="font-size:11px; color:#cbd5e1;">ID: <code>${sens.id}</code></div>
          <div style="font-size:10px; color:#10b981;">Status: LIVE TELEMETRY STREAMING</div>
          ${isRiverGauge ? `<div style="font-size:9px; color:#38bdf8; margin-top:2px;">💡 Click to View 24h Hydrograph Curve</div>` : ''}
        </div>
      `, { sticky: true, direction: "top" });

      if (isRiverGauge) {
        sensorMarker.on("click", () => {
          window.dispatchEvent(new CustomEvent('open-hydrograph-modal', { detail: { villageId: v.id } }));
        });
      }
      sensorLayerRef.current.addLayer(sensorMarker);
    });
  }, [selectedVillageData, villages, activeBasinId]);

// Camera fly-to for village selection and basin switching
const lastFlownVillageIdRef = useRef<string | null>(null);
const lastFlownBasinIdRef = useRef<string | null>(null);

useEffect(() => {
  const map = mapInstanceRef.current;
  if (!map || viewMode !== '2d') return;

  // Check if map container has valid rendered pixel dimensions
  try {
    const size = map.getSize();
    if (!size || size.x <= 0 || size.y <= 0 || isNaN(size.x) || isNaN(size.y)) {
      return;
    }
  } catch (_) {
    return;
  }

  // 1. Village Selection FlyTo
  if (selectedVillageId && lastFlownVillageIdRef.current !== selectedVillageId) {
    lastFlownVillageIdRef.current = selectedVillageId;
    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (v && typeof v.lat === 'number' && typeof v.lng === 'number' && !isNaN(v.lat) && !isNaN(v.lng)) {
      try {
        map.flyTo([v.lat, v.lng], 13.5, { duration: 1.2 });
      } catch (err) {
        console.warn("Leaflet flyTo village error:", err);
      }
    }
    return;
  }

  // 2. Basin Switching FlyTo (when selectedVillageId is null)
  if (!selectedVillageId) {
    if (lastFlownVillageIdRef.current !== null || lastFlownBasinIdRef.current !== activeBasinId) {
      lastFlownVillageIdRef.current = null;
      lastFlownBasinIdRef.current = activeBasinId;
      
      if (activeBasin && activeBasin.center_coords) {
        try {
          map.flyTo([activeBasin.center_coords[0], activeBasin.center_coords[1]], activeBasin.default_zoom || 12.0, { duration: 1.4 });
        } catch (err) {
          console.warn("Leaflet flyTo basin error:", err);
        }
      } else {
        try {
          map.flyTo([22.5, 78.9], 5, { duration: 1.4 });
        } catch (err) {
          console.warn("Leaflet flyTo overview error:", err);
        }
      }
    }
  }
}, [selectedVillageId, villages, selectedVillageData, viewMode, activeBasinId, activeBasin]);

// 5. Layer visibility sync
useEffect(() => {
  const map = mapInstanceRef.current;
  if (!map) return;

  if (layers.hazardZones) map.addLayer(hazardLayerRef.current);
  else map.removeLayer(hazardLayerRef.current);

  if (layers.hexGrid) map.addLayer(hexGridLayerRef.current);
  else map.removeLayer(hexGridLayerRef.current);

  if (layers.shelters) map.addLayer(shelterLayerRef.current);
  else map.removeLayer(shelterLayerRef.current);

  if (layers.routes) map.addLayer(routeLayerRef.current);
  else map.removeLayer(routeLayerRef.current);

  if (layers.streams) map.addLayer(streamLayerRef.current);
  else map.removeLayer(streamLayerRef.current);

  if (layers.sensors) map.addLayer(sensorLayerRef.current);
  else map.removeLayer(sensorLayerRef.current);

  if (layers.contoursDEM) map.addLayer(contoursLayerRef.current);
  else map.removeLayer(contoursLayerRef.current);

  if (dopplerLayerRef.current) {
    if (layers.dopplerRadar) map.addLayer(dopplerLayerRef.current);
    else map.removeLayer(dopplerLayerRef.current);
  }

  // Village markers visibility
  Object.values(markersRef.current).forEach(marker => {
    if (layers.villageLabels) {
      marker.setStyle({ opacity: 1.0, fillOpacity: 0.95 });
    } else {
      marker.setStyle({ opacity: 0.2, fillOpacity: 0.15 });
    }
  });
}, [layers]);

  return (
    <div
      ref={mapContainerRef}
      id="gis-map"
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};
