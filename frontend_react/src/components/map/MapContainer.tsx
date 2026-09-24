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

  // Default map filter drawer to closed as requested
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
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
    <div className="map-wrapper" id="tour-gis-map">
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
        {/* Drawer Header: Title + Dedicated Close Button */}
        <div className="map-panel-header-row">
          <div className="map-panel-header-title">
            <span style={{ fontSize: '0.95rem' }}>🗂️</span>
            <span style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.6px', color: '#f8fafc' }}>
              TACTICAL MAP CONTROLS
            </span>
          </div>
          <button 
            className="map-panel-close-btn"
            onClick={() => setIsControlsOpen(false)}
            title="Close Drawer (Esc)"
            aria-label="Close Drawer"
          >
            <span className="close-icon">&times;</span>
            <span className="close-text">CLOSE</span>
          </button>
        </div>

        {/* Tab Switcher: Layers & 3D vs Hazard Buffer Zones */}
        <div className="map-panel-tab-bar">
          <button 
            className={`map-panel-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            🗺️ Layers &amp; 3D
          </button>
          <button 
            className={`map-panel-tab-btn ${activeTab === 'floodhub' ? 'active' : ''}`}
            onClick={() => setActiveTab('floodhub')}
          >
            🛡️ Hazard Buffer Zones
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
                      google_floodhub: '🌐 Vector Roads',
                      google_terrain: '⛰️ Terrain Topo',
                      google_satellite: '🛰️ Satellite',
                      google_dark: '🌑 Dark Tactical',
                      topo: '🗺️ Open Topo'
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
                      google_hybrid: '🗺️ Satellite Hybrid',
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
                <span><span className="legend-dot" style={{ background: '#ef4444' }}></span> 🔴🟠🟡 Catchment Buffer Zones</span>
              </label>
              <label className="layer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={layers.hexGrid} 
                  onChange={(e) => toggleLayer('hexGrid', e.target.checked)} 
                />
                <span>⬡ Hydrological Catchment Grid</span>
              </label>
              <label className="layer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={layers.particles} 
                  onChange={(e) => toggleLayer('particles', e.target.checked)} 
                />
                <span>🌀 Fluid Velocity Stream (Hydro-Mesh)</span>
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

        {/* ================= TAB 2: CATCHMENT RISK BUFFER ZONES ================= */}
        {activeTab === 'floodhub' && (
          <div className="map-panel-tab-content hazard-buffer-tab-view">
            {/* Map / Hybrid Style Switcher */}
            <div className="buffer-pill-switcher">
              <button 
                className={`buffer-pill-btn ${!isGfhHybridActive ? 'active' : ''}`}
                onClick={() => handleGfhMapToggle('map')}
              >
                {!isGfhHybridActive ? '✓ Topo Map' : 'Topo Map'}
              </button>
              <button 
                className={`buffer-pill-btn ${isGfhHybridActive ? 'active' : ''}`}
                onClick={() => handleGfhMapToggle('hybrid')}
              >
                {isGfhHybridActive ? '✓ Satellite' : 'Satellite'}
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="buffer-tab-bar">
              <button 
                className={`buffer-tab-btn ${floodHubSubTab === 'flood' ? 'active' : ''}`}
                onClick={() => {
                  setFloodHubSubTab('flood');
                  toggleLayer('hazardZones', true);
                }}
              >
                Catchment Contours
              </button>
              <button 
                className={`buffer-tab-btn ${floodHubSubTab === 'coverage' ? 'active' : ''}`}
                onClick={() => {
                  setFloodHubSubTab('coverage');
                  toggleLayer('hexGrid', true);
                }}
              >
                Catchment Grid
              </button>
            </div>

            {/* Master Buffer Switch */}
            <div className="buffer-toggle-row master-toggle">
              <div className="buffer-row-left">
                <span className="buffer-icon-wave">🌊</span>
                <span className="buffer-row-text">Active Hazard Buffer Layers</span>
              </div>
              <label className="buffer-switch">
                <input 
                  type="checkbox" 
                  checked={layers.hazardZones}
                  onChange={(e) => {
                    toggleLayer('hazardZones', e.target.checked);
                    toggleLayer('hexGrid', e.target.checked);
                  }}
                />
                <span className="buffer-slider"></span>
              </label>
            </div>

            {/* NDMA Standard Hazard Buffer Breakdown */}
            <div className="buffer-section">
              <div className="buffer-section-title">NDMA / CWC Hazard Gradation</div>
              <div className="buffer-section-subtitle">Concentric Buffer Zones</div>

              <div className="buffer-severity-list">
                <div className="buffer-severity-item">
                  <span className="buffer-dot dot-extreme"></span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ef4444' }}>🔴 Core Inundation Zone</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Direct submergence | Compulsory evacuation</div>
                  </div>
                </div>

                <div className="buffer-severity-item">
                  <span className="buffer-dot dot-danger"></span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f97316' }}>🟠 Vulnerability Buffer (200m–500m)</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Debris slippage & road cutoff alert</div>
                  </div>
                </div>

                <div className="buffer-severity-item">
                  <span className="buffer-dot dot-warning"></span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#eab308' }}>🟡 Catchment Watch (500m–1.5km)</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Staging periphery & safe transit corridor</div>
                  </div>
                </div>

                <div className="buffer-severity-item with-switch">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="buffer-dot dot-normal"></span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>🟢 Safe Ridge Refuges</div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>High-ground shelters (&gt;950m)</div>
                    </div>
                  </div>
                  <label className="buffer-switch small">
                    <input 
                      type="checkbox" 
                      checked={showNormal}
                      onChange={(e) => setShowNormal(e.target.checked)}
                    />
                    <span className="buffer-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Basin Hydrological Grid Switch */}
            <div className="buffer-toggle-row">
              <div className="buffer-row-left">
                <span className="buffer-row-text">Beas Catchment Threat Grid</span>
              </div>
              <label className="buffer-switch">
                <input 
                  type="checkbox" 
                  checked={layers.hexGrid}
                  onChange={(e) => toggleLayer('hexGrid', e.target.checked)}
                />
                <span className="buffer-slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
