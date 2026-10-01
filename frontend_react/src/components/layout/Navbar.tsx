import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    setMethodologyOpen,
    setGeomorphicOpen,
    theme,
    toggleTheme,
    startTour,
    basins,
    activeBasinId,
    activeBasin,
    switchBasin,
    activePage,
    openTacticalDossier,
    closeTacticalDossier
  } = useFlood();

  return (
    <nav className="navbar">
      {/* Zone 1: Identity & Basin Telemetry Context */}
      <div className="navbar-brand-section">
        <a
          href="/"
          className="brand-wrapper brand-anchor-link"
          onClick={(e) => {
            e.preventDefault();
            closeTacticalDossier();
            window.location.hash = '';
          }}
          title="Return to Vigil-Flood Main Page"
          style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div className="logo-badge">🌊</div>
          <div className="brand-text-container">
            <div className="brand-title">
              VIGIL-FLOOD <span className="brand-tagline">| Early Warning</span>
            </div>
            <div className="brand-subtitle">
              {activeBasin ? `📍 ${activeBasin.name}` : '📍 All-India Valleys'}
            </div>
          </div>
        </a>

        {/* 🗺️ Pan-India Basin Selector (Temporarily commented out per user request)
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
        */}

        <div className="status-pill live-pill">
          <span className="pulse-dot"></span>
          <span className="status-text">LIVE</span>
        </div>
      </div>

      {/* Zone 2: Intelligence & Decision Support HUD */}
      <div className="navbar-hud-section">
        <div className="hud-pill-group">
          {/* 🏔️ ISRO Landslide Atlas & NDMA LHZ 147 Districts Registry */}
          {/* <button 
            id="btn-open-geomorphic-zonation" 
            className="hud-pill-btn isro-btn"
            onClick={() => {
              setGeomorphicOpen(true);
              window.dispatchEvent(new CustomEvent('open-geomorphic-zonation-modal'));
            }}
            title="Open ISRO Landslide Atlas & NDMA LHZ 147 Districts Registry"
            aria-label="Open ISRO Geomorphic Zonation"
          >
            <span>🏔️</span> <span className="btn-text">ISRO Zonation (147)</span>
          </button> */}

          {/* ⚠️ State & National Weather Alerts Table */}
          <button
            id="btn-open-state-alerts"
            className="hud-pill-btn alerts-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-state-alerts-table-modal'))}
            title="Open Location & State-wise Weather Alerts Table"
            aria-label="Open State Weather Alerts Table"
          >
            <span>⚡</span> <span className="btn-text">State Alerts</span>
          </button>

          {/* 🛡️ Dedicated Evacuation & Incident Operations Dashboard */}
          <button
            id="btn-open-tactical-dossier"
            className="hud-pill-btn"
            onClick={() => activePage === 'tactical_dossier' ? closeTacticalDossier() : openTacticalDossier()}
            title="Open Dedicated Unified Evacuation Operations Dashboard"
            aria-label="Open Evacuation Operations Dashboard"
            style={{
              background: activePage === 'tactical_dossier' ? 'rgba(56, 189, 248, 0.25)' : undefined,
              borderColor: activePage === 'tactical_dossier' ? '#38bdf8' : undefined,
              color: activePage === 'tactical_dossier' ? '#38bdf8' : undefined,
              fontWeight: 700
            }}
          >
            <span>🛡️</span> <span className="btn-text">Evacuation Ops</span>
          </button>

          <button
            id="btn-open-methodology"
            className="hud-pill-btn"
            onClick={() => setMethodologyOpen(true)}
            title="View Scientific Methodology"
          >
            <span>ℹ️</span> <span className="btn-text">Methodology</span>
          </button>

          {/* ✨ Interactive Guided Product Tour */}
          <button
            id="btn-start-tour"
            className="hud-pill-btn tour-btn"
            onClick={startTour}
            title="Take a 60-Second Guided Tour"
            aria-label="Start Guided Product Tour"
          >
            <span>✨</span> <span className="btn-text">Quick Tour</span>
          </button>
        </div>
      </div>

      {/* Zone 3: Emergency Actions, Theme & Role Switcher */}
      <div className="navbar-actions-section">

        {/* 🌍 English & Hindi Translator Dropdown */}
        <div className="language-selector-container basin-selector-container" style={{ borderRadius: '12px', marginRight: '16px' }}>
          <select
            id="lang-select"
            className="basin-select-dropdown"
            defaultValue="en"
            title="Translate Website"
            aria-label="Translate Website"
            style={{ borderRadius: '8px' }}
          >
            <option value="en">🇬🇧 English</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* 📢 CAP-SACHET Emergency Cell Broadcast Center */}
        <button
          id="btn-open-broadcast"
          className="nav-emergency-cta-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-broadcast-modal'))}
          title="Open CAP-SACHET & Cell Broadcast Center"
          aria-label="Open Emergency Broadcast"
        >
          <span className="cta-icon">📢</span> <span className="cta-text">CAP Broadcast</span>
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
