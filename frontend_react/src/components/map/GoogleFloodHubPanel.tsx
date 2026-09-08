import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';

export const GoogleFloodHubPanel: React.FC = () => {
  const { 
    basemap2D, 
    setBasemap2D, 
    setBasemap3D, 
    viewMode, 
    layers, 
    toggleLayer 
  } = useFlood();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'flood' | 'coverage'>('flood');
  const [showNormal, setShowNormal] = useState(true);

  const handleMapToggle = (type: 'map' | 'hybrid') => {
    if (type === 'hybrid') {
      setBasemap2D('google_satellite');
      if (viewMode === '3d') setBasemap3D('google_hybrid');
    } else {
      setBasemap2D('google_floodhub');
      if (viewMode === '3d') setBasemap3D('google_hybrid');
    }
  };

  const isHybridActive = basemap2D === 'google_satellite';

  return (
    <div id="google-floodhub-options-card" className="google-floodhub-card">
      <div className="gfh-header">
        <div className="gfh-title-group">
          <span className="gfh-layers-icon">🗂️</span>
          <span className="gfh-title">View options</span>
          <span className="gfh-info-icon" title="Official Google Flood Hub Layer Controls">ℹ️</span>
        </div>
        <button 
          className="gfh-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title="Toggle Panel"
        >
          {isCollapsed ? '▸' : '▾'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="gfh-body">
          {/* Map / Hybrid Pill Toggle */}
          <div className="gfh-pill-switcher">
            <button 
              className={`gfh-pill-btn ${!isHybridActive ? 'active' : ''}`}
              onClick={() => handleMapToggle('map')}
            >
              {!isHybridActive ? '✓ Map' : 'Map'}
            </button>
            <button 
              className={`gfh-pill-btn ${isHybridActive ? 'active' : ''}`}
              onClick={() => handleMapToggle('hybrid')}
            >
              {isHybridActive ? '✓ Hybrid' : 'Hybrid'}
            </button>
          </div>

          {/* Flood Data / Coverage Map Tabs */}
          <div className="gfh-tab-bar">
            <button 
              className={`gfh-tab-btn ${activeTab === 'flood' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('flood');
                toggleLayer('hazardZones', true);
              }}
            >
              Flood data
            </button>
            <button 
              className={`gfh-tab-btn ${activeTab === 'coverage' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('coverage');
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
              <span className="gfh-row-text">Floods (riverine and flash)</span>
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
              <span className="gfh-info-icon" style={{ fontSize: '0.75rem' }}>ℹ️</span>
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
  );
};
