import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const Navbar: React.FC = () => {
  const { role, setRole, setMethodologyOpen } = useFlood();

  return (
    <nav className="navbar">
      <div className="brand-wrapper">
        <div className="logo-badge">🌊</div>
        <div>
          <div className="brand-title">
            VIGIL-FLOOD <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>| SIH 26192</span>
          </div>
          <div className="brand-subtitle">
            Hyper-Local Flash Flood Early Warning System • Pilot: Beas Basin, Mandi (HP)
          </div>
        </div>
      </div>

      <div className="nav-actions">
        <button 
          id="btn-open-methodology" 
          className="nav-action-btn"
          onClick={() => setMethodologyOpen(true)}
        >
          <span>ℹ️</span> Scientific Methodology
        </button>

        <div className="status-pill">
          <span className="pulse-dot"></span>
          <span>LIVE SENSOR TELEMETRY</span>
        </div>

        <div className="role-switcher">
          <button 
            className={`role-btn ${role === 'authority' ? 'active' : ''}`}
            onClick={() => setRole('authority')}
          >
            Disaster Authority
          </button>
          <button 
            className={`role-btn ${role === 'citizen' ? 'active' : ''}`}
            onClick={() => setRole('citizen')}
          >
            Citizen View
          </button>
        </div>
      </div>
    </nav>
  );
};
