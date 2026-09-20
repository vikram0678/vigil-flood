import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const Navbar: React.FC = () => {
  const { role, setRole, setMethodologyOpen, theme, toggleTheme } = useFlood();

  return (
    <nav className="navbar">
      <div className="brand-wrapper">
        <div className="logo-badge">🌊</div>
        <div className="brand-text-container">
          <div className="brand-title">
            VIGIL-FLOOD <span className="brand-tagline">| Early Warning</span>
          </div>
          <div className="brand-subtitle">
            Hyper-Local Flash Flood Early Warning • Pilot: Beas Basin, Mandi (HP)
          </div>
        </div>
      </div>

      <div className="nav-actions">
        <button 
          id="btn-open-methodology" 
          className="nav-action-btn"
          onClick={() => setMethodologyOpen(true)}
          title="View Scientific Methodology"
        >
          <span>ℹ️</span> <span className="btn-text">Methodology</span>
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
