import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useFlood } from '../../context/FloodContext';
import { BASEMAP_2D_TILES, RISK_COLORS } from '../../constants';

export const GISMap2D: React.FC = () => {
  const { 
    villages, 
    selectedVillageId, 
    selectedVillageData, 
    selectVillage, 
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

  // 1. Initialize Leaflet Map Instance ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const mandiCoords: [number, number] = [31.74, 77.10];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(mandiCoords, 11);

    mapInstanceRef.current = map;

    // Attach layer groups
    hexGridLayerRef.current.addTo(map);
    hazardLayerRef.current.addTo(map);
    streamLayerRef.current.addTo(map);
    shelterLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);
    sensorLayerRef.current.addTo(map);

    L.control.scale({ position: 'bottomleft' }).addTo(map);

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

    // Render Hexagonal Risk Grid
    hexGridLayerRef.current.clearLayers();
    villages.forEach(v => {
      const cellRadius = 0.015;
      const hexPoints: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        hexPoints.push([
          v.lat + cellRadius * Math.sin(angle),
          v.lng + cellRadius * Math.cos(angle) * 1.15
        ]);
      }
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      L.polygon(hexPoints, {
        color: color,
        weight: 1.5,
        opacity: 0.7,
        fillColor: color,
        fillOpacity: 0.22,
        dashArray: '4, 4'
      }).addTo(hexGridLayerRef.current);
    });
  }, [villages, selectVillage]);

  // 4. Update Overlays for Selected Village (Inundation, Shelters, Routes, Streams)
  useEffect(() => {
    if (!selectedVillageData) return;
    const v = selectedVillageData.village;

    hazardLayerRef.current.clearLayers();
    streamLayerRef.current.clearLayers();
    shelterLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    // Inundation Polygon
    if (v.inundation_polygon && v.inundation_polygon.length > 0) {
      const color = RISK_COLORS[v.risk_level] || RISK_COLORS.LOW;
      L.polygon(v.inundation_polygon, {
        color: color,
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.45,
        dashArray: '5, 5'
      }).addTo(hazardLayerRef.current);
    }

    // River Drainage Stream Line
    if (v.river_stream && v.river_stream.length > 0) {
      L.polyline(v.river_stream, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.85
      }).addTo(streamLayerRef.current);

      L.polyline(v.river_stream, {
        color: '#ffffff',
        weight: 3,
        opacity: 0.9,
        className: 'animated-stream-flow-pulse'
      }).addTo(streamLayerRef.current);
    }

    // Shelters
    if (v.shelters && v.shelters.length > 0) {
      v.shelters.forEach(s => {
        const icon = L.divIcon({
          className: 'custom-shelter-pin',
          html: `<div class="shelter-pin-badge" title="${s.name} (${s.elevation_m}m)">⛺</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        L.marker([s.lat, s.lng], { icon })
          .bindTooltip(`<b>${s.name}</b><br>Safe Elevation: ${s.elevation_m}m | Cap: ${s.capacity}`, { direction: 'top' })
          .addTo(shelterLayerRef.current);
      });
    }

    // Evacuation Routes
    if (v.routes && v.routes.length > 0) {
      v.routes.forEach(r => {
        L.polyline(r.path, {
          color: r.is_safe ? '#10b981' : '#ef4444',
          weight: 4,
          dashArray: r.is_safe ? undefined : '6, 6'
        }).bindTooltip(`<b>${r.name}</b><br>Status: ${r.is_safe ? '🟢 Recommended Safe' : '🔴 Flood Inundated'}`, { direction: 'top' })
          .addTo(routeLayerRef.current);
      });
    }
  }, [selectedVillageData]);

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
  }, [layers]);

  return (
    <div 
      ref={mapContainerRef} 
      id="gis-map" 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};
