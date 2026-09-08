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
    layers
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
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const hexPolygonsRef = useRef<Record<string, L.Polygon>>({});

  // Auto-invalidateSize whenever viewMode switches to 2D
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

    const mandiCoords: [number, number] = [31.74, 77.10];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(mandiCoords, 11);

    mapInstanceRef.current = map;
    (window as any).leafletMap = map;

    // Attach layer groups
    hexGridLayerRef.current.addTo(map);
    hazardLayerRef.current.addTo(map);
    streamLayerRef.current.addTo(map);
    shelterLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);
    sensorLayerRef.current.addTo(map);

    L.control.scale({ position: 'bottomleft' }).addTo(map);

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
        closeOnClick: false,
        className: 'custom-elevation-popup'
      })
        .setLatLng([lat, lng])
        .setContent(`
          <div class="elevation-popup-card">
            <div class="elev-popup-header">
              <div class="elev-popup-title">📡 Querying 30m DEM...</div>
              <button onclick="document.querySelector('.leaflet-popup-close-button')?.click();" class="elev-close-btn">&times;</button>
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
      map.remove();
      mapInstanceRef.current = null;
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

  // 4. Update Overlays for Selected Village (Hazard Zones, Shelters, Routes, Streams, Sensors)
  const renderedVillageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedVillageData) return;
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

    // A. Hazard Area Inundation & Slope Polygons (Red, Orange, Green Zones)
    const zones = v.hazard_zones;
    if (zones) {
      // 🔴 Red Inundation Zone
      if (zones.red_inundation_polygon && zones.red_inundation_polygon.length > 0) {
        const redPoly = L.polygon(zones.red_inundation_polygon, {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: isCritical ? 0.55 : 0.35,
          weight: isCritical ? 3 : 2,
          dashArray: isCritical ? "4, 6" : undefined
        });
        redPoly.bindTooltip("<b>🔴 Red Hazard Zone</b><br>High Flash Flood & Inundation Risk", { sticky: true });
        hazardLayerRef.current.addLayer(redPoly);
      }

      // 🟠 Orange Slope Zone
      if (zones.orange_slope_polygon && zones.orange_slope_polygon.length > 0) {
        const orangePoly = L.polygon(zones.orange_slope_polygon, {
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.25,
          weight: 1.5
        });
        orangePoly.bindTooltip("<b>🟠 Orange Buffer Zone</b><br>Steep Slope & Debris Flow Risk", { sticky: true });
        hazardLayerRef.current.addLayer(orangePoly);
      }

      // 🟢 Green Safe Ridge Zone
      if (zones.green_safe_polygon && zones.green_safe_polygon.length > 0) {
        const greenPoly = L.polygon(zones.green_safe_polygon, {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.3,
          weight: 2
        });
        greenPoly.bindTooltip("<b>🟢 Green Safe Zone</b><br>Elevated Ground / Safe Relief Area", { sticky: true });
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
          iconSize: [210, 30],
          iconAnchor: [105, 15]
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
  }, [selectedVillageData]);

  // Camera fly-to ONLY when selected village explicitly changes
  const lastFlownVillageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedVillageId) return;
    if (lastFlownVillageIdRef.current === selectedVillageId) return;

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (v && v.lat && v.lng) {
      lastFlownVillageIdRef.current = selectedVillageId;
      mapInstanceRef.current.flyTo([v.lat, v.lng], 13, { duration: 1.2 });
    }
  }, [selectedVillageId, villages, selectedVillageData]);

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
  }, [layers]);

  return (
    <div
      ref={mapContainerRef}
      id="gis-map"
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};
