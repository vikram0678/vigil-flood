import React, { useEffect, useRef } from 'react';
import { useFlood } from '../../context/FloodContext';
import L from 'leaflet';
import maplibregl from 'maplibre-gl';

export const MapWeatherHazardSymbols: React.FC = () => {
  const { viewMode, switchBasin } = useFlood();
  const leafletMarkersRef = useRef<L.LayerGroup | null>(null);
  const map3dMarkersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    let isMounted = true;

    const renderSymbols = async () => {
      try {
        const res = await fetch('/api/weather/live-hazard-symbols');
        if (!res.ok) return;
        const data = await res.json();
        const symbols = data.symbols || [];
        if (!isMounted) return;

        // 1. Render on Leaflet (2D Map)
        const map2d = (window as any).leafletMap as L.Map;
        if (map2d && typeof map2d.addLayer === 'function') {
          if (!leafletMarkersRef.current) {
            leafletMarkersRef.current = L.layerGroup().addTo(map2d);
          } else {
            leafletMarkersRef.current.clearLayers();
          }

          symbols.forEach((s: any) => {
            const iconHtml = `
              <div class="weather-hazard-map-pin ${s.severity.toLowerCase()}" style="--pin-color: ${s.color};">
                <span class="hazard-emoji">${s.icon}</span>
                <span class="hazard-pulse-ring"></span>
              </div>
            `;

            const marker = L.marker(s.coordinates, {
              icon: L.divIcon({
                className: 'weather-symbol-marker-wrapper',
                html: iconHtml,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              })
            });

            marker.bindPopup(`
              <div class="hazard-symbol-popup">
                <div class="popup-event-header" style="background: ${s.color}20; border-left: 3px solid ${s.color};">
                  <div class="popup-icon">${s.icon}</div>
                  <div>
                    <div class="popup-title" style="color: ${s.color};">${s.event}</div>
                    <div class="popup-loc">📍 <b>${s.location_name}</b> (${s.state})</div>
                  </div>
                </div>
                <div class="popup-body">
                  <div class="popup-headline">${s.headline}</div>
                  <div class="popup-stats-grid">
                    <div>🌧️ Rain: <b>${s.rainfall_mmh} mm/h</b></div>
                    <div>🌱 Soil: <b>${s.soil_moisture_pct}%</b></div>
                    <div>⛰️ Elev: <b>${s.elevation_m}m</b></div>
                    <div>⚠️ Tier: <b style="color: ${s.color};">${s.severity}</b></div>
                  </div>
                  <div class="popup-directive">
                    🚨 <b>DIRECTIVE:</b> ${s.action_directive}
                  </div>
                  <div class="popup-issued-by">🏛️ ${s.issued_by}</div>
                </div>
              </div>
            `);

            leafletMarkersRef.current?.addLayer(marker);
          });
        }

        // 2. Render on MapLibre (3D Map)
        const map3d = (window as any).map3dInstance as maplibregl.Map;
        if (map3d) {
          map3dMarkersRef.current.forEach(m => m.remove());
          map3dMarkersRef.current = [];

          symbols.forEach((s: any) => {
            const el = document.createElement('div');
            el.className = `weather-hazard-map-pin ${s.severity.toLowerCase()}`;
            el.style.setProperty('--pin-color', s.color);
            el.innerHTML = `
              <span class="hazard-emoji">${s.icon}</span>
              <span class="hazard-pulse-ring"></span>
            `;

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="hazard-symbol-popup">
                <div class="popup-event-header" style="background: ${s.color}20; border-left: 3px solid ${s.color};">
                  <div class="popup-icon">${s.icon}</div>
                  <div>
                    <div class="popup-title" style="color: ${s.color};">${s.event}</div>
                    <div class="popup-loc">📍 <b>${s.location_name}</b> (${s.state})</div>
                  </div>
                </div>
                <div class="popup-body">
                  <div class="popup-headline">${s.headline}</div>
                  <div class="popup-stats-grid">
                    <div>🌧️ Rain: <b>${s.rainfall_mmh} mm/h</b></div>
                    <div>🌱 Soil: <b>${s.soil_moisture_pct}%</b></div>
                  </div>
                  <div class="popup-directive">🚨 ${s.action_directive}</div>
                </div>
              </div>
            `);

            const marker3d = new maplibregl.Marker({ element: el })
              .setLngLat([s.coordinates[1], s.coordinates[0]]) // [lng, lat]
              .setPopup(popup)
              .addTo(map3d);

            map3dMarkersRef.current.push(marker3d);
          });
        }
      } catch (err) {
        console.error('Failed to render live hazard symbols:', err);
      }
    };

    renderSymbols();
    const interval = setInterval(renderSymbols, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      leafletMarkersRef.current?.clearLayers();
      map3dMarkersRef.current.forEach(m => m.remove());
    };
  }, [viewMode]);

  return null;
};
