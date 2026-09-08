import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';
import { GISMap2D } from './GISMap2D';
import { GISMap3D } from './GISMap3D';
import { NullschoolCanvas } from './NullschoolCanvas';
import { GoogleFloodHubPanel } from './GoogleFloodHubPanel';
import { Basemap2D, Basemap3D } from '../../types';

export const MapContainer: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    basemap2D, 
    setBasemap2D, 
    basemap3D, 
    setBasemap3D,
    layers,
    toggleLayer,
    isDroneFlying,
    toggleDroneFlying
  } = useFlood();

  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(true);

  return (
    <div className="map-wrapper">
      {/* 2D Leaflet Tactical Map & Nullschool particles */}
      <div style={{ width: '100%', height: '100%', display: viewMode === '2d' ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }}>
        <GISMap2D />
        <NullschoolCanvas />
      </div>

      {/* 3D WebGL Mountain Terrain Mesh Map */}
      <div style={{ width: '100%', height: '100%', display: viewMode === '3d' ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }}>
        <GISMap3D />
      </div>

      {/* Google Flood Hub Floating View Options Card */}
      <GoogleFloodHubPanel />

      {/* Slide Floating Button when panel is closed/collapsed */}
      {!isControlsOpen && (
        <button 
          className="map-slide-toggle-floating"
          onClick={() => setIsControlsOpen(true)}
          title="Open Map & Layer Controls"
          aria-label="Open Map & Layer Controls"
        >
          <span>◀ 🗺️ Map Layers & 3D</span>
        </button>
      )}

      {/* Interactive Basemap Switcher & Layer Filter Controls */}
      <div className={`map-controls-panel ${isControlsOpen ? '' : 'collapsed'}`}>
        {/* Panel Header with Slide / Close button */}
        <div className="map-panel-header-row">
          <span className="map-panel-header-title">🗺️ Map & Layers</span>
          <button 
            className="map-panel-slide-close-btn"
            onClick={() => setIsControlsOpen(false)}
            title="Slide & Close Panel"
          >
            <span>Slide</span> <span>▶</span>
          </button>
        </div>

        {/* 2D / 3D Dimension Switcher */}
        <div className="view-mode-bar">
          <button 
            className={`view-mode-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            🗺️ 2D Tactical
          </button>
          <button 
            className={`view-mode-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            🏔️ 3D Mountain Mesh
          </button>
        </div>

        {/* 2D Basemaps */}
        {viewMode === '2d' && (
          <div>
            <div className="map-control-title">
              <span>🗺️ Base Map (2D)</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STYLE</span>
            </div>
            <div className="basemap-toggle-grid">
              {(['google_floodhub', 'google_terrain', 'google_satellite', 'google_dark', 'topo'] as Basemap2D[]).map((bm) => {
                const labels: Record<Basemap2D, string> = {
                  google_floodhub: '🌐 Google Roads',
                  google_terrain: '⛰️ G-Terrain',
                  google_satellite: '🛰️ G-Satellite',
                  google_dark: '🌑 Dark Mode',
                  topo: '🗺️ Topo'
                };
                return (
                  <button
                    key={bm}
                    className={`basemap-btn ${basemap2D === bm ? 'active' : ''}`}
                    onClick={() => setBasemap2D(bm)}
                  >
                    {labels[bm]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3D Basemaps */}
        {viewMode === '3d' && (
          <div>
            <div className="map-control-title">
              <span>🏔️ 3D Base Imagery</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>1.5x DEM</span>
            </div>
            <div className="basemap-toggle-grid">
              {(['google_hybrid', 'esri_satellite', 'topo_3d', 'dark_3d'] as Basemap3D[]).map((bm) => {
                const labels: Record<Basemap3D, string> = {
                  google_hybrid: '🗺️ Google Hybrid',
                  esri_satellite: '🛰️ ESRI Satellite',
                  topo_3d: '⛰️ 3D Contours',
                  dark_3d: '🌑 3D Dark'
                };
                return (
                  <button
                    key={bm}
                    className={`basemap-3d-btn ${basemap3D === bm ? 'active' : ''}`}
                    onClick={() => setBasemap3D(bm)}
                  >
                    {labels[bm]}
                  </button>
                );
              })}
            </div>

            {/* River Runner 3D Drone Camera Flythrough */}
            <button 
              className={`drone-flythrough-btn ${isDroneFlying ? 'active' : ''}`}
              onClick={() => toggleDroneFlying()}
              title="Automated 3D Evacuation Drone Flight along River Gorge"
            >
              <span>🚁</span>
              <span>{isDroneFlying ? 'Stop 3D Drone Flight' : 'Start 3D Drone Flythrough'}</span>
            </button>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '6px 0 2px 0' }}>
              • <b>Right-Click + Drag:</b> Tilt 3D Horizon<br/>
              • <b>Ctrl + Drag:</b> 360° Rotate Mountain Gorge
            </div>
          </div>
        )}

        {/* Hazard Overlays Filters */}
        <div className="map-control-title" style={{ marginTop: '4px' }}>
          <span>🛡️ Hazard Overlays</span>
        </div>

        <div className="layer-filters-list">
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.hazardZones} 
              onChange={(e) => toggleLayer('hazardZones', e.target.checked)} 
            />
            <span><span className="legend-dot" style={{ background: '#ef4444' }}></span> Inundation Zones</span>
          </label>
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.hexGrid} 
              onChange={(e) => toggleLayer('hexGrid', e.target.checked)} 
            />
            <span>⬡ Risk Grid (Google Flood Hub)</span>
          </label>
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.particles} 
              onChange={(e) => toggleLayer('particles', e.target.checked)} 
            />
            <span>🌀 Fluid Particles (Earth Nullschool)</span>
          </label>
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.shelters} 
              onChange={(e) => toggleLayer('shelters', e.target.checked)} 
            />
            <span>⛺ Safe Relief Shelters</span>
          </label>
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.routes} 
              onChange={(e) => toggleLayer('routes', e.target.checked)} 
            />
            <span>🛣️ Evacuation Paths</span>
          </label>
          <label className="layer-checkbox-label">
            <input 
              type="checkbox" 
              checked={layers.streams} 
              onChange={(e) => toggleLayer('streams', e.target.checked)} 
            />
            <span>🌊 River Drainage Streams</span>
          </label>
        </div>
      </div>
    </div>
  );
};
