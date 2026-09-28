import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const PilotCatchmentPanel: React.FC = () => {
  const { 
    villages, 
    selectedVillageId, 
    selectVillage,
    basins,
    activeBasinId,
    activeBasin,
    switchBasin
  } = useFlood();

  // Compute District Hazard Index average
  const avgRisk = villages.length > 0 
    ? Math.round(villages.reduce((acc, v) => acc + (v.risk_percentage || 0), 0) / villages.length) 
    : 0;

  return (
    <aside className="panel pilot-catchment-panel" id="tour-villages-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>📍 {activeBasin ? activeBasin.name : 'Pilot Catchment'}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {villages.length} Wards
        </span>
      </div>

      <div className="panel-body">
        {/* Basin Quick Switcher Pills */}
        <div className="basin-quick-tabs">
          {basins.map(b => (
            <button
              key={b.basin_id}
              className={`basin-quick-tab-btn ${b.basin_id === activeBasinId ? 'active' : ''}`}
              onClick={() => switchBasin(b.basin_id)}
              data-location-tooltip={`${b.name} (${b.state})`}
            >
              <span>{b.state.includes('Himachal') ? '🏔️ HP' : b.state.includes('Uttarakhand') ? '⛰️ UK' : b.state.includes('Sikkim') ? '🌊 SK' : '🌧️ KL'}</span>
            </button>
          ))}
        </div>

        {/* District Threat Index Meter */}
        <div className="threat-meter-card">
          <div className="threat-header">
            <span>{activeBasin ? activeBasin.state : 'District'} Hazard Index</span>
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
                  {selectedVillageId === null ? `● ${activeBasin?.name || 'Active Basin'} Overview` : 'Click to zoom out to India'}
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

        <div className="village-list-header">{activeBasin ? `${activeBasin.name.toUpperCase()} WARDS` : 'PILOT WARDS (CLICK TO FOCUS)'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {villages.map((v, idx) => {
            const isSelected = v.id === selectedVillageId;
            const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';
            const riskPct = v.risk_percentage || 0;
            const radius = 15;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (riskPct / 100) * circumference;
            const ringColor = riskPct >= 70 ? '#ef4444' : riskPct >= 40 ? '#f59e0b' : '#10b981';

            return (
              <div
                key={v.id}
                className={`village-card ${isSelected ? 'selected' : ''} ${isCritical ? 'severity-critical' : ''}`}
                onClick={() => selectVillage(v.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div className="village-rank-badge">#{idx + 1}</div>
                  <div className="village-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4>{v.name}</h4>
                      {isSelected && (
                        <span className="active-village-pill">
                          ● ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="village-meta">Elev: {v.elevation_m}m | Slope: {v.slope_deg}°</div>
                    <div className="village-shelter-preview">
                      <span style={{ color: isCritical ? '#f87171' : 'var(--text-muted)', fontWeight: isCritical ? 700 : 500 }}>
                        ⏳ {v.lead_time_display || '10-30 min'}
                      </span>
                      <span>•</span>
                      <span>⛺ {typeof v.primary_shelter === 'object' && v.primary_shelter !== null ? (v.primary_shelter as any).name : (v.primary_shelter || 'Safe Ridge')}</span>
                    </div>
                  </div>
                </div>

                {/* Circular SVG Micro Threat Ring */}
                <div className="village-risk-ring-container" title={`${v.risk_level} • ${riskPct}% Hazard`}>
                  <svg width="40" height="40" viewBox="0 0 40 40" className="risk-ring-svg">
                    <circle cx="20" cy="20" r="15" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    <circle 
                      cx="20" 
                      cy="20" 
                      r="15" 
                      fill="transparent" 
                      stroke={ringColor} 
                      strokeWidth="3" 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 20 20)"
                      style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div className="risk-ring-text" style={{ color: ringColor }}>
                    {riskPct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
