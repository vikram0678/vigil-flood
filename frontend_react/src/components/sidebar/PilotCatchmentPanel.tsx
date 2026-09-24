import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const PilotCatchmentPanel: React.FC = () => {
  const { villages, selectedVillageId, selectVillage } = useFlood();

  // Compute District Hazard Index average
  const avgRisk = villages.length > 0 
    ? Math.round(villages.reduce((acc, v) => acc + (v.risk_percentage || 0), 0) / villages.length) 
    : 0;

  return (
    <aside className="panel">
      <div className="panel-header">
        <div className="panel-title">📍 Pilot Catchment</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {villages.length} Wards
        </span>
      </div>

      <div className="panel-body">
        {/* District Threat Index Meter */}
        <div className="threat-meter-card">
          <div className="threat-header">
            <span>District Hazard Index</span>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>{avgRisk}%</span>
          </div>
          <div className="threat-bar-container">
            <div className="threat-bar-fill" style={{ width: `${avgRisk}%` }}></div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>🟢 Baseline</span>
            <span>🟡 Moderate</span>
            <span>🔴 Critical</span>
          </div>
        </div>

        {/* All-India National View Switcher */}
        <div 
          className={`village-card national-overview-card ${selectedVillageId === null ? 'selected' : ''}`}
          onClick={() => selectVillage(null)}
          style={{ 
            marginBottom: '4px',
            border: selectedVillageId === null ? '1px solid var(--accent-cyan)' : '1px dashed var(--border-color)',
            background: selectedVillageId === null ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)'
          }}
          title="Click to view full All-India National Map overview"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  All-India National View
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {selectedVillageId === null ? '● Active Overview • 1 Pilot Basin' : 'Click to zoom out to India'}
                </div>
              </div>
            </div>
            {selectedVillageId === null && (
              <span className="active-village-pill" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                ● OVERVIEW
              </span>
            )}
          </div>
        </div>

        <div className="village-list-header">BEAS BASIN PILOT WARDS (CLICK TO FOCUS)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {villages.map((v, idx) => {
            const isSelected = v.id === selectedVillageId;
            const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';
            const badgeClass = `badge-${(v.risk_level || 'low').toLowerCase()}`;

            return (
              <div
                key={v.id}
                className={`village-card ${isSelected ? 'selected' : ''} ${isCritical ? 'critical-pulse-card' : ''}`}
                onClick={() => selectVillage(v.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="village-rank-badge">#{idx + 1}</div>
                  <div className="village-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4>{v.name}</h4>
                      {isSelected && (
                        <span className="active-village-pill">
                          ● ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="village-meta">Elev: {v.elevation_m}m | Slope: {v.slope_deg}°</div>
                    <div className="village-shelter-preview">
                      <span>⏳ {v.lead_time_display || '10-30 min'}</span>
                      <span>•</span>
                      <span>⛺ {typeof v.primary_shelter === 'object' && v.primary_shelter !== null ? (v.primary_shelter as any).name : (v.primary_shelter || 'Safe Ridge')}</span>
                    </div>
                  </div>
                </div>
                <div className={`risk-badge ${badgeClass}`}>
                  {v.risk_badge} {v.risk_percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
