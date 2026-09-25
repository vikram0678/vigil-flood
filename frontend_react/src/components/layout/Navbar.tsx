import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const Navbar: React.FC = () => {
  const { 
    role, 
    setRole, 
    setMethodologyOpen, 
    theme, 
    toggleTheme, 
    startTour,
    basins,
    activeBasinId,
    activeBasin,
    switchBasin
  } = useFlood();

  return (
    <nav className="navbar">
      <div className="brand-wrapper">
        <div className="logo-badge">🌊</div>
        <div className="brand-text-container">
          <div className="brand-title">
            VIGIL-FLOOD <span className="brand-tagline">| Early Warning</span>
          </div>
          <div className="brand-subtitle">
            {activeBasin ? `📍 ${activeBasin.name} • ${activeBasin.state}` : 'Pan-India Multi-Basin System'}
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* 🗺️ Pan-India Basin Selector */}
        <div className="basin-selector-container">
          <select 
            id="basin-select"
            className="basin-select-dropdown"
            value={activeBasinId}
            onChange={(e) => switchBasin(e.target.value)}
            title="Switch River Basin / State"
            aria-label="Switch River Basin"
          >
            {basins.map(b => (
              <option key={b.basin_id} value={b.basin_id}>
                {b.state.includes('Himachal') ? '🏔️' : b.state.includes('Uttarakhand') ? '⛰️' : b.state.includes('Sikkim') ? '🌊' : '🌧️'} {b.name} ({b.state})
              </option>
            ))}
          </select>
        </div>
        {/* ✨ Interactive Guided Product Tour */}
        <button 
          id="btn-start-tour" 
          className="nav-action-btn tour-nav-btn"
          onClick={startTour}
          title="Take a 60-Second Guided Tour"
          aria-label="Start Guided Product Tour"
        >
          <span>✨</span> <span className="btn-text">Quick Tour</span>
        </button>

        <button 
          id="btn-open-methodology" 
          className="nav-action-btn"
          onClick={() => setMethodologyOpen(true)}
          title="View Scientific Methodology"
        >
          <span>ℹ️</span> <span className="btn-text">Methodology</span>
        </button>

        {/* ⚠️ State & National Weather Alerts Table */}
        <button 
          id="btn-open-state-alerts" 
          className="nav-action-btn alerts-nav-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('open-state-alerts-table-modal'))}
          title="Open Location & State-wise Weather Alerts Table"
          aria-label="Open State Weather Alerts Table"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            color: '#fde68a',
            fontWeight: 700
          }}
        >
          <span>⚡</span> <span className="btn-text">State Alerts</span>
        </button>

        {/* 📢 CAP-SACHET Emergency Cell Broadcast Center */}
        <button 
          id="btn-open-broadcast" 
          className="nav-action-btn broadcast-nav-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-broadcast-modal'))}
          title="Open CAP-SACHET & Cell Broadcast Center"
          aria-label="Open Emergency Broadcast"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.4) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
            fontWeight: 700
          }}
        >
          <span>📢</span> <span className="btn-text">CAP Broadcast</span>
        </button>

        {/* Theme Mode Toggle (Dark / Light) */}
        <button 
          id="btn-theme-toggle" 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Theme Mode"
        >
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <div className="status-pill">
          <span className="pulse-dot"></span>
          <span className="status-text">LIVE TELEMETRY</span>
        </div>

        <div className="role-switcher">
          <button 
            className={`role-btn ${role === 'authority' ? 'active' : ''}`}
            onClick={() => setRole('authority')}
          >
            Authority
          </button>
          <button 
            className={`role-btn ${role === 'citizen' ? 'active' : ''}`}
            onClick={() => setRole('citizen')}
          >
            Citizen
          </button>
        </div>
      </div>
    </nav>
  );
};
