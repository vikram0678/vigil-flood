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
    allVillages,
    selectedVillageId,
    selectedVillageData,
    selectVillage,
    viewMode,
    basemap2D,
    layers,
    hazardFilter,
    simulation,
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
  const dopplerRadarGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const renderedWaterStageRef = useRef<number | null>(null);
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
    dopplerRadarGroupRef.current = L.layerGroup().addTo(map);
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

    L.control.scale({ position: 'bottomright', metric: true, imperial: true, maxWidth: 120 }).addTo(map);

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
    baseLayerRef.current.bringToBack();

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
    if (!map) return;

    // Use all 26 villages so national map always renders full India context
    const sourceVillages = allVillages && allVillages.length > 0 ? allVillages : villages;

    // Clean up markers that are no longer in the active village set
    const currentVillageIds = new Set(sourceVillages.map(v => v.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentVillageIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    Object.keys(hexPolygonsRef.current).forEach(id => {
      if (!currentVillageIds.has(id)) {
        hexPolygonsRef.current[id].remove();
        delete hexPolygonsRef.current[id];
      }
    });

    if (sourceVillages.length === 0) return;

    // Filter villages according to the selected hazard filter
    const filteredVillages = sourceVillages.filter(v => {
      if (!hazardFilter || hazardFilter === 'ALL') return true;
      const isMultiHazard = (v.slope_deg || 0) > 30 && (v.risk_percentage || 0) > 60;
      const isLandslide = (v.slope_deg || 0) > 35;
      const isFlashFlood = !isLandslide || (v.distance_to_stream_m && v.distance_to_stream_m < 50);

      if (hazardFilter === 'MULTI_HAZARD') return isMultiHazard;
      if (hazardFilter === 'LANDSLIDE') return isLandslide;
      if (hazardFilter === 'FLASH_FLOOD') return isFlashFlood;
      return true;
    });

    // Remove markers that are filtered out
    const filteredIds = new Set(filteredVillages.map(v => v.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!filteredIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    Object.keys(hexPolygonsRef.current).forEach(id => {
      if (!filteredIds.has(id)) {
        hexPolygonsRef.current[id].remove();
        delete hexPolygonsRef.current[id];
      }
    });

    filteredVillages.forEach(v => {
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';
      const isDanger = v.risk_level === 'HIGH' || v.risk_level === 'DANGER';
      const isMultiHazard = (v.slope_deg || 0) > 30 && (v.risk_percentage || 0) > 60;
      const isLandslide = (v.slope_deg || 0) > 35;

      const isSelected = v.id === selectedVillageId;
      const isStateActive = activeBasinId === 'ALL' ||
        v.basin_id === activeBasinId ||
        (activeBasin && (v.state === activeBasin.state || (activeBasin.name && activeBasin.name.includes(v.state))));

      // Shape coding
      const shapeIcon = isMultiHazard ? '⚡' : (isLandslide ? '⚠️' : '🌊');
      // const shapeClass = isMultiHazard ? 'shape-hexagon' : (isLandslide ? 'shape-triangle' : 'shape-diamond');
      const shapeClass = 'shape-circle';
      // Determine pin wrapper classes
      let pinClasses = 'senior-hazard-pin-wrapper';
      if (isSelected) {
        pinClasses += ' village-selected-beacon';
      } else if (isCritical) {
        pinClasses += ' critical-pulse';
      } else if (isDanger) {
        pinClasses += ' danger-pulse';
      }

      // Ring effect logic:
      // When ALL is active: all 26 villages display animated radar pulse ring.
      // When a state is selected: ONLY the selected state villages display the animated radar ring.
      // Villages from other states: ring effect is turned off, but markers remain completely clear and normal (NOT darkened).
      const showRadarRing = isStateActive && !isSelected;
      const markerHtml = `
        <div class="${pinClasses}">
          ${showRadarRing ? `
            <div class="dual-radar-ring ring-1" style="border-color: ${color};"></div>
            <div class="dual-radar-ring ring-2" style="border-color: ${color};"></div>
          ` : ''}
          <div class="senior-hazard-badge ${shapeClass}" style="background: ${color}; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            <span class="hazard-geom-symbol">${shapeIcon}</span>
          </div>
          <div class="senior-elevation-tag">
            <span>▲ ${v.elevation_m}m</span>
            <span class="threat-score" style="color: ${color}; font-weight: 800;">${v.risk_percentage}%</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'senior-leaflet-marker-anchor',
        html: markerHtml,
        iconSize: [42, 54],
        iconAnchor: [21, 27]
      });

      if (!markersRef.current[v.id]) {
        const marker = (L.marker as any)([v.lat, v.lng], { icon: customIcon }).addTo(map);

        marker.bindTooltip(`
          <div class="disaster-tooltip-card">
            <div class="tooltip-header-row">
              <span class="tooltip-shape-tag">${shapeIcon}</span>
              <span class="tooltip-title">${v.name}</span>
            </div>
            <div class="tooltip-severity" style="color: ${color};">
              ${isCritical ? '🔴 CRITICAL SURGE' : (isDanger ? '🟠 HIGH THREAT WATCH' : (v.risk_level === 'MODERATE' ? '🟡 ADVISORY' : '🟢 STABLE BASELINE'))} (${v.risk_percentage}%)
            </div>
            <div class="tooltip-evac-window">
              ⏱️ Evac Window: <strong>${v.lead_time_display || '47 min'}</strong>
            </div>
            <div class="tooltip-meta-row">
              <span>⛰️ ${v.elevation_m}m ASL</span>
              <span>📐 ${v.slope_deg}° Slope</span>
            </div>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          offset: [0, -20],
          className: 'senior-disaster-tooltip'
        });

        marker.on('click', () => selectVillage(v.id));
        markersRef.current[v.id] = marker;
      } else {
        (markersRef.current[v.id] as any).setIcon(customIcon);
      }
    });

    // Render Hexagonal Risk Grid (Google Flood Hub Style) in-place
    sourceVillages.forEach(v => {
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
          opacity: 0.65,
          fillColor: color,
          fillOpacity: 0.18,
          dashArray: '4, 4'
        }).addTo(hexGridLayerRef.current);
        hexPolygonsRef.current[v.id] = poly;
      } else {
        hexPolygonsRef.current[v.id].setStyle({
          color: color,
          fillColor: color,
          opacity: 0.65,
          fillOpacity: 0.18
        });
      }
    });
  }, [allVillages, villages, selectVillage, activeBasinId, activeBasin, selectedVillageId, hazardFilter]);

  // 4. Update Overlays for Selected Village or Entire Basin (Hazard Zones, Shelters, Routes, Streams, Sensors)
  const renderedVillageIdRef = useRef<string | null>(null);
  const renderedHasDetailRef = useRef<boolean>(false);

  useEffect(() => {
    const sourceVillages = allVillages && allVillages.length > 0 ? allVillages : villages;
    const v = selectedVillageId
      ? ((selectedVillageData?.village?.id === selectedVillageId ? selectedVillageData.village : null) || sourceVillages.find(x => x.id === selectedVillageId))
      : null;

    const hasDetail = Boolean(selectedVillageData?.village?.id && selectedVillageData.village.id === selectedVillageId);

    // Case 1: Overview mode (no village selected)
    if (!v || !selectedVillageId) {
      if (renderedVillageIdRef.current === '__OVERVIEW__' + activeBasinId) {
        return;
      }
      renderedVillageIdRef.current = '__OVERVIEW__' + activeBasinId;
      renderedHasDetailRef.current = false;

      hazardLayerRef.current.clearLayers();
      streamLayerRef.current.clearLayers();
      shelterLayerRef.current.clearLayers();
      routeLayerRef.current.clearLayers();
      sensorLayerRef.current.clearLayers();

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

    // Case 2: A specific village IS selected
    // If already rendered with full detail and water stage hasn't changed, skip re-render
    const currentWaterStage = simulation?.water ?? 1.8;
    if (
      renderedVillageIdRef.current === v.id && 
      renderedHasDetailRef.current === hasDetail && 
      renderedWaterStageRef.current === currentWaterStage
    ) {
      return;
    }

    renderedVillageIdRef.current = v.id;
    renderedHasDetailRef.current = hasDetail;
    renderedWaterStageRef.current = currentWaterStage;

    hazardLayerRef.current.clearLayers();
    streamLayerRef.current.clearLayers();
    shelterLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();
    sensorLayerRef.current.clearLayers();

    const isCritical = (hasDetail && (selectedVillageData?.risk_analysis?.risk_level === 'CRITICAL' || selectedVillageData?.risk_analysis?.risk_level === 'EXTREME')) || v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';

    // A. Concentric 3-Tier Catchment Hazard Buffer Zones (🔴 Core, 🟠 Buffer, 🟡 Watch/🟢 Refuge)
    const zones = v.hazard_zones;
    if (zones) {
      // 🌊 INUNDATION DEPTH MAP: Multi-Tier Depth Contours based on Copernicus DEM (0.1m to 5m+)
      if (zones.red_inundation_polygon && zones.red_inundation_polygon.length > 0) {
        const pts = zones.red_inundation_polygon;
        const expansionFactor = 1.0 + Math.max(0, (currentWaterStage - 1.2) * 0.18);
        const cLat = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
        const cLng = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;

        // Depth Band 4: Shallow Fringe Runoff (0.1m - 0.5m)
        const shallowPts = pts.map(p => [
          cLat + (p[0] - cLat) * (expansionFactor * 1.30),
          cLng + (p[1] - cLng) * (expansionFactor * 1.30)
        ] as [number, number]);
        const shallowPoly = L.polygon(shallowPts, {
          color: "#eab308",
          fillColor: "#eab308",
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: "3, 3"
        });
        shallowPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:200px; padding:2px;">
            <div style="font-weight:800; font-size:0.82rem; color:#eab308;">🌊 SHALLOW OVERLAND RUNOFF (0.1m – 0.5m)</div>
            <div style="font-size:0.74rem; color:#cbd5e1; margin-top:2px;">Depth: <b>~0.35m</b> • Flow Vel: <b>0.8 m/s</b></div>
            <div style="font-size:0.7rem; color:#fef08a;">Accessible by high-clearance emergency 4x4 vehicles only.</div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(shallowPoly);

        // Depth Band 3: Moderate Flood Inundation (0.5m - 1.5m)
        const modPts = pts.map(p => [
          cLat + (p[0] - cLat) * (expansionFactor * 1.05),
          cLng + (p[1] - cLng) * (expansionFactor * 1.05)
        ] as [number, number]);
        const modPoly = L.polygon(modPts, {
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.28,
          weight: 2
        });
        modPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:200px; padding:2px;">
            <div style="font-weight:800; font-size:0.82rem; color:#f97316;">⚠️ MODERATE INUNDATION DEPTH (0.5m – 1.5m)</div>
            <div style="font-size:0.74rem; color:#cbd5e1; margin-top:2px;">Depth: <b>~1.10m</b> • Flow Vel: <b>1.6 m/s</b></div>
            <div style="font-size:0.7rem; color:#fdba74;">Road impassable to civilian vehicles. Pedestrian sweep hazard.</div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(modPoly);

        // Depth Band 2: Severe Flood Inundation (1.5m - 3.0m)
        const severePts = pts.map(p => [
          cLat + (p[0] - cLat) * (expansionFactor * 0.78),
          cLng + (p[1] - cLng) * (expansionFactor * 0.78)
        ] as [number, number]);
        const severePoly = L.polygon(severePts, {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.45,
          weight: 2.5
        });
        severePoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:210px; padding:2px;">
            <div style="font-weight:800; font-size:0.82rem; color:#ef4444;">🚨 SEVERE INUNDATION DEPTH (1.5m – 3.0m)</div>
            <div style="font-size:0.74rem; color:#cbd5e1; margin-top:2px;">Depth: <b>~2.35m</b> • Flow Vel: <b>2.5 m/s</b></div>
            <div style="font-size:0.7rem; color:#fca5a5;">Total structural flooding. Deployment of NDRF Zodiac boats required.</div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(severePoly);

        // Depth Band 1: Deep River Channel Core (> 3.0m)
        const deepPts = pts.map(p => [
          cLat + (p[0] - cLat) * (expansionFactor * 0.48),
          cLng + (p[1] - cLng) * (expansionFactor * 0.48)
        ] as [number, number]);
        const deepPoly = L.polygon(deepPts, {
          color: "#b91c1c",
          fillColor: "#b91c1c",
          fillOpacity: 0.65,
          weight: 3,
          className: "hazard-polygon-red"
        });
        deepPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; min-width:220px; padding:2px;">
            <div style="font-weight:800; font-size:0.85rem; color:#f87171; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:3px; margin-bottom:4px;">
              <span>🌊</span> <span>DEEP CHANNEL SURGE (&gt; 3.0m)</span>
            </div>
            <div style="font-size:0.74rem; color:#cbd5e1; margin-bottom:4px;">
              Max Projected Depth: <b>${Math.max(3.2, currentWaterStage + 1.6).toFixed(2)}m</b> • Velocity: <b>3.8 m/s</b>
            </div>
            <div style="font-size:0.72rem; color:#fca5a5; background:rgba(239,68,68,0.2); padding:4px 6px; border-radius:4px; border-left:3px solid #b91c1c;">
              🚨 <b>CWC DANGER BREACH:</b> Total hydraulic overtopping. Immediate evacuation.
            </div>
          </div>
        `, { sticky: true });
        hazardLayerRef.current.addLayer(deepPoly);
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

      // 3. Continuous Animated Downhill Pulse Line (mid-depth flow)
      const pulseLine = L.polyline(stream, {
        color: "#bae6fd",
        weight: 3.5,
        opacity: 0.90,
        className: "animated-stream-flow-pulse"
      });
      streamLayerRef.current.addLayer(pulseLine);

      // 3b. Fast Surface Turbulence Overlay (thinner, faster dashes)
      const turbulenceLine = L.polyline(stream, {
        color: "#ffffff",
        weight: 1.8,
        opacity: 0.75,
        className: "animated-stream-turbulence"
      });
      streamLayerRef.current.addLayer(turbulenceLine);

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

    // D. Realistic Topographic Evacuation Routes (🛣️)
    const routes = v.evacuation_routes || v.routes || [];
    routes.forEach((r, rIdx) => {
      const isSafe = r.safety_score !== undefined ? r.safety_score > 50 : (r.is_safe ?? true);
      const rawPath = r.path && r.path.length > 0 ? r.path : [[v.lat, v.lng], [shelters[0]?.lat || v.lat, shelters[0]?.lng || v.lng]];

      // If only 2 or 3 coarse points exist, smooth into realistic mountain road bends
      let pathCoords: [number, number][] = (rawPath as [number, number][]).map(pt => [pt[0], pt[1]]);
      if (rawPath.length >= 2 && rawPath.length <= 4) {
        const smoothed: [number, number][] = [];
        for (let i = 0; i < rawPath.length - 1; i++) {
          const p1 = rawPath[i];
          const p2 = rawPath[i + 1];
          const dLat = p2[0] - p1[0];
          const dLng = p2[1] - p1[1];
          // Perpendicular offset for mountain contour curve
          const offsetSign = (i % 2 === 0 ? 1 : -1) * (rIdx % 2 === 0 ? 1 : -1);
          const midLat = (p1[0] + p2[0]) / 2 + (-dLng) * 0.18 * offsetSign;
          const midLng = (p1[1] + p2[1]) / 2 + (dLat) * 0.18 * offsetSign;
          
          smoothed.push([p1[0], p1[1]]);
          smoothed.push([(p1[0] * 3 + midLat) / 4, (p1[1] * 3 + midLng) / 4]);
          smoothed.push([midLat, midLng]);
          smoothed.push([(midLat + p2[0] * 3) / 4, (midLng + p2[1] * 3) / 4]);
        }
        smoothed.push([rawPath[rawPath.length - 1][0], rawPath[rawPath.length - 1][1]]);
        pathCoords = smoothed;
      }

      // Outer Glow / Casing for High Contrast Visibility against Satellite & Dark Basemaps
      const routeCasing = L.polyline(pathCoords as L.LatLngExpression[], {
        color: isSafe ? "#064e3b" : "#7f1d1d",
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeLayerRef.current.addLayer(routeCasing);

      // Core Corridor Line
      const routeLine = L.polyline(pathCoords as L.LatLngExpression[], {
        color: isSafe ? "#34d399" : "#f87171",
        weight: 3.5,
        dashArray: isSafe ? "8, 6" : "3, 5",
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const tooltipContent = `
        <div style="font-family:'Outfit',sans-serif; padding:4px 6px; min-width:180px;">
          <div style="font-weight:800; font-size:0.85rem; color:${isSafe ? '#10b981' : '#ef4444'}; display:flex; align-items:center; gap:6px;">
            <span>${isSafe ? '🛡️ RECOMMENDED' : '⚠️ HAZARD - FLOOD CUTOFF'}</span>
          </div>
          <div style="font-weight:700; font-size:0.82rem; color:#f8fafc; margin-top:2px;">${r.name}</div>
          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:4px;">
            Safety Score: <b style="color:${isSafe ? '#34d399' : '#f87171'}">${r.safety_score ?? (isSafe ? 90 : 25)}/100</b>
          </div>
          <div style="font-size:0.70rem; color:${isSafe ? '#a7f3d0' : '#fca5a5'}; margin-top:2px;">
            Status: <b>${r.status || (isSafe ? 'VERIFIED OPEN' : 'AVOID')}</b>
          </div>
        </div>
      `;
      routeLine.bindTooltip(tooltipContent, { sticky: true });
      routeLayerRef.current.addLayer(routeLine);

      // Waypoint Directional Pin at Midway Point
      if (pathCoords.length > 2) {
        const midIdx = Math.floor(pathCoords.length / 2);
        const midCoord = pathCoords[midIdx];
        const routeWaypointMarker = L.marker([midCoord[0], midCoord[1]], {
          icon: L.divIcon({
            className: "route-waypoint-pin",
            html: `<div style="
              background:${isSafe ? '#059669' : '#dc2626'};
              color:#ffffff;
              font-size:10px;
              font-weight:800;
              padding:2px 6px;
              border-radius:10px;
              border:1px solid #ffffff;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
              white-space:nowrap;
              display:flex;
              align-items:center;
              gap:3px;
            ">
              <span>${isSafe ? '🛣️ Safe Exit' : '⛔ Closed'}</span>
            </div>`,
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          }),
          interactive: false
        });
        routeLayerRef.current.addLayer(routeWaypointMarker);
      }
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
  }, [selectedVillageData, villages, allVillages, activeBasinId, selectedVillageId, simulation?.water]);

  // Synchronize 2D Doppler Radar Storm Polygons from Radar Player events
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleRadarFrame = (e: any) => {
      if (!layers.dopplerRadar || !dopplerRadarGroupRef.current) return;
      const frame = e.detail?.frame;
      const frameIdx = e.detail?.frameIndex ?? 3;
      if (!frame) return;

      dopplerRadarGroupRef.current.clearLayers();

      const offsetLat = (frameIdx - 3) * 0.04;
      const offsetLng = (frameIdx - 3) * 0.05;
      const dbz = frame.peakDbz || 50;
      const radarColor = dbz >= 65 ? '#c026d3' : dbz >= 55 ? '#ef4444' : dbz >= 45 ? '#f97316' : dbz >= 35 ? '#eab308' : '#10b981';

      const stormCenters = [
        { lat: 31.70 + offsetLat, lng: 77.05 + offsetLng, radius: 0.16 + (dbz / 400), name: 'Beas-Kullu Cloudburst Cell' },
        { lat: 30.55 + offsetLat * 0.8, lng: 79.50 + offsetLng * 0.8, radius: 0.14 + (dbz / 450), name: 'Alaknanda Convective Band' },
        { lat: 27.60 + offsetLat * 1.2, lng: 88.55 + offsetLng * 1.2, radius: 0.15 + (dbz / 420), name: 'Teesta Basin Storm Core' },
        { lat: 11.60 + offsetLat * 0.5, lng: 76.15 + offsetLng * 0.5, radius: 0.13 + (dbz / 500), name: 'Wayanad Monsoon Influx' }
      ];

      stormCenters.forEach(sc => {
        const ring: [number, number][] = [];
        const numPoints = 18;
        for (let a = 0; a <= numPoints; a++) {
          const angle = (a / numPoints) * 2 * Math.PI;
          const wobble = 1.0 + 0.15 * Math.sin(angle * 3 + frameIdx);
          const r = sc.radius * wobble;
          ring.push([sc.lat + r * Math.sin(angle), sc.lng + r * Math.cos(angle) * 1.2]);
        }

        const radarPoly = L.polygon(ring, {
          color: radarColor,
          fillColor: radarColor,
          fillOpacity: 0.38,
          weight: 2,
          dashArray: '4, 4',
          className: 'doppler-radar-storm-poly'
        });
        radarPoly.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif; padding:2px;">
            <div style="font-weight:800; color:${radarColor};">🌧️ ${sc.name}</div>
            <div style="font-size:11px; color:#cbd5e1;">Reflectivity: <b>${dbz} dBZ</b> • Frame: <b>${frame.timeLabel}</b></div>
            <div style="font-size:10px; color:#38bdf8; margin-top:2px;">Status: ${frame.status}</div>
          </div>
        `, { sticky: true });
        dopplerRadarGroupRef.current.addLayer(radarPoly);
      });
    };

    window.addEventListener('imd-radar-frame-change', handleRadarFrame);
    return () => window.removeEventListener('imd-radar-frame-change', handleRadarFrame);
  }, [layers.dopplerRadar]);

  // Camera fly-to for village selection and basin switching
  const lastFlownVillageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== '2d') return;

    try {
      const size = map.getSize();
      if (!size || size.x <= 0 || size.y <= 0 || isNaN(size.x) || isNaN(size.y)) {
        return;
      }
    } catch (_) {
      return;
    }

    if (selectedVillageId) {
      if (lastFlownVillageIdRef.current !== selectedVillageId) {
        const sourceVillages = allVillages && allVillages.length > 0 ? allVillages : villages;
        const targetVillage = sourceVillages.find(x => x.id === selectedVillageId) ||
          (selectedVillageData?.village?.id === selectedVillageId ? selectedVillageData.village : null);

        if (targetVillage && typeof targetVillage.lat === 'number' && typeof targetVillage.lng === 'number' && !isNaN(targetVillage.lat) && !isNaN(targetVillage.lng)) {
          lastFlownVillageIdRef.current = selectedVillageId;
          try {
            map.stop();
            map.flyTo([targetVillage.lat, targetVillage.lng], 13.5, {
              duration: 1.0,
              easeLinearity: 0.25
            });
          } catch (err) {
            console.warn("Leaflet flyTo village error:", err);
          }
        }
      }
      return;
    }

    if (!selectedVillageId) {
      if (lastFlownVillageIdRef.current !== null) {
        lastFlownVillageIdRef.current = null;
        try {
          map.stop();
          map.flyTo([22.5, 78.9], 5, { duration: 1.0 });
        } catch (err) {
          console.warn("Leaflet flyTo overview error:", err);
        }
      }
    }
  }, [selectedVillageId, villages, allVillages, selectedVillageData, viewMode, activeBasinId, activeBasin]);

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

    if (dopplerRadarGroupRef.current) {
      if (layers.dopplerRadar) map.addLayer(dopplerRadarGroupRef.current);
      else map.removeLayer(dopplerRadarGroupRef.current);
    }

    // Village markers visibility
    Object.values(markersRef.current).forEach(marker => {
      if (!marker) return;
      if (typeof (marker as any).setStyle === 'function') {
        (marker as any).setStyle({ opacity: layers.villageLabels ? 1.0 : 0.2, fillOpacity: layers.villageLabels ? 0.95 : 0.15 });
      } else if (typeof (marker as any).setOpacity === 'function') {
        (marker as any).setOpacity(layers.villageLabels ? 1.0 : 0.2);
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
