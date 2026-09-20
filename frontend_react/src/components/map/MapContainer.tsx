import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';
import { GISMap2D } from './GISMap2D';
import { GISMap3D } from './GISMap3D';
import { NullschoolCanvas } from './NullschoolCanvas';
import { MapNavControls } from './MapNavControls';
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

  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<'layers' | 'floodhub'>('layers');
  const [floodHubSubTab, setFloodHubSubTab] = useState<'flood' | 'coverage'>('flood');
  const [showNormal, setShowNormal] = useState<boolean>(true);

  const handleGfhMapToggle = (type: 'map' | 'hybrid') => {
    if (type === 'hybrid') {
      setBasemap2D('google_satellite');
      if (viewMode === '3d') setBasemap3D('google_hybrid');
    } else {
      setBasemap2D('google_floodhub');
      if (viewMode === '3d') setBasemap3D('google_hybrid');
    }
  };

  const isGfhHybridActive = basemap2D === 'google_satellite';

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

      {/* 🧭 Integrated Map Navigation Controls (Top-Left: Compass, Zoom In, Zoom Out) */}
      <MapNavControls />

      {/* Slide Floating Button when drawer is collapsed */}
      {!isControlsOpen && (
        <button 
          className="map-slide-toggle-floating"
          onClick={() => setIsControlsOpen(true)}
          title="Open Map & Layer Controls"
          aria-label="Open Map & Layer Controls"
        >
          <span>◀ 🗺️ Map Controls</span>
        </button>
      )}

      {/* Unified Tabbed GIS Control Drawer (Option A: Layers & 3D + Google Flood Hub) */}
      <div className={`map-controls-panel ${isControlsOpen ? '' : 'collapsed'}`}>
        {/* Drawer Header: Dual Tabs + Slide/Close Button */}
        <div className="map-panel-header-row">
          <div className="map-panel-tab-bar">
            <button 
              className={`map-panel-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              🗺️ Layers & 3D
            </button>
            <button 
              className={`map-panel-tab-btn ${activeTab === 'floodhub' ? 'active' : ''}`}
              onClick={() => setActiveTab('floodhub')}
            >
              🗂️ Flood Hub
            </button>
          </div>
          <button 
            className="map-panel-slide-close-btn"
            onClick={() => setIsControlsOpen(false)}
            title="Slide & Close Panel"
          >
            <span>Slide</span> <span>▶</span>
          </button>
        </div>

        {/* ================= TAB 1: LAYERS & 3D ================= */}
        {activeTab === 'layers' && (
          <div className="map-panel-tab-content">
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
              <div style={{ marginTop: '8px' }}>
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
              <div style={{ marginTop: '8px' }}>
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
                  style={{ marginTop: '8px' }}
                >
                  <span>🚁</span>
                  <span>{isDroneFlying ? 'Stop 3D Drone Flight' : 'Start 3D Drone Flythrough'}</span>
                </button>

                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.3, margin: '6px 0 2px 0' }}>
                  • <b>Right-Click + Drag:</b> Tilt 3D Horizon<br/>
                  • <b>Ctrl + Drag:</b> 360° Rotate Mountain Gorge
                </div>
              </div>
            )}

            {/* Hazard Overlays Filters */}
            <div className="map-control-title" style={{ marginTop: '10px' }}>
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
        )}

        {/* ================= TAB 2: GOOGLE FLOOD HUB VIEW OPTIONS ================= */}
        {activeTab === 'floodhub' && (
          <div className="map-panel-tab-content gfh-tab-view">
            {/* Map / Hybrid Pill Toggle */}
            <div className="gfh-pill-switcher">
              <button 
                className={`gfh-pill-btn ${!isGfhHybridActive ? 'active' : ''}`}
                onClick={() => handleGfhMapToggle('map')}
              >
                {!isGfhHybridActive ? '✓ Map' : 'Map'}
              </button>
              <button 
                className={`gfh-pill-btn ${isGfhHybridActive ? 'active' : ''}`}
                onClick={() => handleGfhMapToggle('hybrid')}
              >
                {isGfhHybridActive ? '✓ Hybrid' : 'Hybrid'}
              </button>
            </div>

            {/* Flood Data / Coverage Map Tabs */}
            <div className="gfh-tab-bar">
              <button 
                className={`gfh-tab-btn ${floodHubSubTab === 'flood' ? 'active' : ''}`}
                onClick={() => {
                  setFloodHubSubTab('flood');
                  toggleLayer('hazardZones', true);
                }}
              >
                Flood data
              </button>
              <button 
                className={`gfh-tab-btn ${floodHubSubTab === 'coverage' ? 'active' : ''}`}
                onClick={() => {
                  setFloodHubSubTab('coverage');
                  toggleLayer('hexGrid', true);
                }}
              >
                Coverage map
              </button>
            </div>

            {/* Floods Master Switch */}
            <div className="gfh-toggle-row master-toggle">
              <div className="gfh-row-left">
                <span className="gfh-icon-wave">🌊</span>
                <span className="gfh-row-text">Floods (riverine & flash)</span>
              </div>
              <label className="gfh-switch">
                <input 
                  type="checkbox" 
                  checked={layers.hazardZones}
                  onChange={(e) => {
                    toggleLayer('hazardZones', e.target.checked);
                    toggleLayer('hexGrid', e.target.checked);
                  }}
                />
                <span className="gfh-slider"></span>
              </label>
            </div>

            {/* Riverine Floods Expected Severity Legend */}
            <div className="gfh-section">
              <div className="gfh-section-title">Riverine floods</div>
              <div className="gfh-section-subtitle">Expected severity</div>

              <div className="gfh-severity-list">
                <div className="gfh-severity-item"><span className="gfh-dot dot-extreme"></span> Extreme</div>
                <div className="gfh-severity-item"><span className="gfh-dot dot-danger"></span> Danger</div>
                <div className="gfh-severity-item"><span className="gfh-dot dot-warning"></span> Warning</div>
                <div className="gfh-severity-item"><span className="gfh-dot dot-nodata"></span> No data</div>
                <div className="gfh-severity-item with-switch">
                  <span><span className="gfh-dot dot-normal"></span> Normal</span>
                  <label className="gfh-switch small">
                    <input 
                      type="checkbox" 
                      checked={showNormal}
                      onChange={(e) => setShowNormal(e.target.checked)}
                    />
                    <span className="gfh-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Urban Flash Floods Beta Switch */}
            <div className="gfh-toggle-row">
              <div className="gfh-row-left">
                <span className="gfh-row-text">Urban flash floods <span className="gfh-badge-beta">Beta</span></span>
              </div>
              <label className="gfh-switch">
                <input 
                  type="checkbox" 
                  checked={layers.hexGrid}
                  onChange={(e) => toggleLayer('hexGrid', e.target.checked)}
                />
                <span className="gfh-slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
