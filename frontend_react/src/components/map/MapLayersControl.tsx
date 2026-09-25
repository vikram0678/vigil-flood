import React, { useState, useRef, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';
import { Basemap2D, Basemap3D } from '../../types';

export const MapLayersControl: React.FC = () => {
  const { 
    viewMode, 
    basemap2D, 
    setBasemap2D, 
    basemap3D, 
    setBasemap3D, 
    layers, 
    toggleLayer 
  } = useFlood();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBaseMapSelect = (type: 'dark' | 'satellite' | 'terrain') => {
    if (viewMode === '2d') {
      if (type === 'dark') setBasemap2D('google_dark');
      else if (type === 'satellite') setBasemap2D('google_satellite');
      else setBasemap2D('google_terrain');
    } else {
      if (type === 'dark') setBasemap3D('dark_3d');
      else if (type === 'satellite') setBasemap3D('google_hybrid');
      else setBasemap3D('topo_3d');
    }
  };

  const isCurrentBasemap = (type: 'dark' | 'satellite' | 'terrain') => {
    if (viewMode === '2d') {
      if (type === 'dark') return basemap2D === 'google_dark' || basemap2D === 'google_floodhub';
      if (type === 'satellite') return basemap2D === 'google_satellite';
      if (type === 'terrain') return basemap2D === 'google_terrain' || basemap2D === 'topo';
    } else {
      if (type === 'dark') return basemap3D === 'dark_3d';
      if (type === 'satellite') return basemap3D === 'google_hybrid' || basemap3D === 'esri_satellite';
      if (type === 'terrain') return basemap3D === 'topo_3d';
    }
    return false;
  };

  return (
    <div className="google-layers-widget-container" ref={containerRef} id="tour-map-layers">
      {/* 🌊 Google Maps Style Floating Layers Button */}
      <button 
        className={`google-layers-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Map Details & Layers"
        aria-label="Toggle Map Layers"
      >
        <div className="layers-btn-thumbnail">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <span className="layers-btn-label">Layers</span>
      </button>

      {/* 🗺️ Expanded Google Maps Style Details Sheet */}
      {isOpen && (
        <div className="google-layers-popover-sheet">
          <div className="sheet-header">
            <h4>Map details</h4>
            <button className="sheet-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          <div className="sheet-scroll-body">
            {/* 1. Map Details & Overlays Grid */}
            <div className="sheet-section">
              <div className="section-label">MAP DETAILS & HAZARDS</div>
              <div className="details-card-grid">
                {/* Live Storm Pins */}
                <button 
                  className={`detail-tile-card ${layers.stormSymbols ? 'active' : ''}`}
                  onClick={() => toggleLayer('stormSymbols')}
                >
                  <div className="tile-icon-bubble storm-bubble">⛈️</div>
                  <span className="tile-name">Weather Pins</span>
                  <div className="tile-active-indicator"></div>
                </button>

                {/* River Hydro-Vectors */}
                <button 
                  className={`detail-tile-card ${layers.streams ? 'active' : ''}`}
                  onClick={() => toggleLayer('streams')}
                >
                  <div className="tile-icon-bubble river-bubble">🌊</div>
                  <span className="tile-name">River Flow</span>
                  <div className="tile-active-indicator"></div>
                </button>

                {/* 30m Slope & DEM Contours */}
                <button 
                  className={`detail-tile-card ${layers.contoursDEM ? 'active' : ''}`}
                  onClick={() => toggleLayer('contoursDEM')}
                >
                  <div className="tile-icon-bubble terrain-bubble">⛰️</div>
                  <span className="tile-name">30m Slopes</span>
                  <div className="tile-active-indicator"></div>
                </button>

                {/* Safe Shelters & Evac Routes */}
                <button 
                  className={`detail-tile-card ${layers.shelters ? 'active' : ''}`}
                  onClick={() => toggleLayer('shelters')}
                >
                  <div className="tile-icon-bubble shelter-bubble">🛡️</div>
                  <span className="tile-name">Safe Refuge</span>
                  <div className="tile-active-indicator"></div>
                </button>

                {/* IoT Sensors */}
                <button 
                  className={`detail-tile-card ${layers.sensors ? 'active' : ''}`}
                  onClick={() => toggleLayer('sensors')}
                >
                  <div className="tile-icon-bubble sensor-bubble">📡</div>
                  <span className="tile-name">IoT Gauges</span>
                  <div className="tile-active-indicator"></div>
                </button>

                {/* Doppler Rain Radar */}
                <button 
                  className={`detail-tile-card ${layers.dopplerRadar ? 'active' : ''}`}
                  onClick={() => toggleLayer('dopplerRadar')}
                >
                  <div className="tile-icon-bubble radar-bubble">🌧️</div>
                  <span className="tile-name">Rain Radar</span>
                  <div className="tile-active-indicator"></div>
                </button>
              </div>
            </div>

            {/* 2. Base Map Type */}
            <div className="sheet-section">
              <div className="section-label">MAP TYPE</div>
              <div className="map-type-card-grid">
                <button 
                  className={`map-type-card ${isCurrentBasemap('dark') ? 'active' : ''}`}
                  onClick={() => handleBaseMapSelect('dark')}
                >
                  <div className="type-thumb dark-thumb">
                    <span className="thumb-preview-icon">🗺️</span>
                  </div>
                  <span className="type-name">Dark Topo</span>
                </button>

                <button 
                  className={`map-type-card ${isCurrentBasemap('satellite') ? 'active' : ''}`}
                  onClick={() => handleBaseMapSelect('satellite')}
                >
                  <div className="type-thumb sat-thumb">
                    <span className="thumb-preview-icon">🛰️</span>
                  </div>
                  <span className="type-name">Satellite</span>
                </button>

                <button 
                  className={`map-type-card ${isCurrentBasemap('terrain') ? 'active' : ''}`}
                  onClick={() => handleBaseMapSelect('terrain')}
                >
                  <div className="type-thumb terrain-thumb">
                    <span className="thumb-preview-icon">🌐</span>
                  </div>
                  <span className="type-name">Terrain 3D</span>
                </button>
              </div>
            </div>

            {/* 3. Map Tools & Checkboxes */}
            <div className="sheet-section tools-section">
              <div className="section-label">MAP TOOLS</div>
              <div className="tools-checkbox-stack">
                <label className="tool-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={layers.villageLabels}
                    onChange={() => toggleLayer('villageLabels')}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="tool-label">Village & Ward Labels</span>
                </label>

                <label className="tool-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={layers.flowArrows}
                    onChange={() => toggleLayer('flowArrows')}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="tool-label">Kinematic Flow Direction Vectors</span>
                </label>

                <label className="tool-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={layers.hazardZones}
                    onChange={() => toggleLayer('hazardZones')}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="tool-label">2D Inundation Flood Polygons</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
