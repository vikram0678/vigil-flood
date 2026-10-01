import React, { useMemo } from 'react';
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

  // Sort strictly in descending order of risk percentage (highest threat first)
  const sortedVillages = useMemo(() => {
    return [...villages].sort((a, b) => (b.risk_percentage || 0) - (a.risk_percentage || 0));
  }, [villages]);

  // Compute District or National Hazard Index average
  const avgRisk = sortedVillages.length > 0 
    ? Math.round(sortedVillages.reduce((acc, v) => acc + (v.risk_percentage || 0), 0) / sortedVillages.length) 
    : 0;

  return (
    <aside className="panel pilot-catchment-panel" id="tour-villages-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <span>{activeBasinId === 'ALL' ? '📍 All-India Pilot Basins' : `📍 ${activeBasin ? activeBasin.name : 'Pilot Catchment'}`}</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {sortedVillages.length} Wards
        </span>
      </div>

      <div className="panel-body">
        {/* State / Basin Dropdown Selector */}
        <div className="state-dropdown-section">
          <div className="state-dropdown-header">
            <span className="state-dropdown-label">
              <span className="state-dropdown-icon">🗺️</span>
              <span>Filter State / Basin:</span>
            </span>
            <span className="state-sort-tag">
              ⚡ Descending Risk
            </span>
          </div>
          <div className="state-select-wrapper">
            <select
              id="state-basin-select"
              className="state-basin-dropdown-select"
              value={activeBasinId}
              onChange={(e) => switchBasin(e.target.value)}
              aria-label="Filter villages by State or Basin"
            >
              <option value="ALL">🌐 All States (All 26 Villages Monitored)</option>
              <option value="BASIN-HP-BEAS">🏔️ Himachal Pradesh (11 Wards - Beas & Sutlej)</option>
              <option value="BASIN-UK-ALAK">⛰️ Uttarakhand (5 Wards - Alaknanda Valley)</option>
              <option value="BASIN-SK-TEESTA">🌊 Sikkim (5 Wards - Teesta River Basin)</option>
              <option value="BASIN-KL-WAYANAD">🌧️ Kerala (5 Wards - Wayanad Chaliyar)</option>
            </select>
            <span className="custom-dropdown-arrow">▼</span>
          </div>
        </div>

        {/* Basin Quick Switcher Pills (Synced with Dropdown) */}
        <div className="basin-quick-tabs">
          <button
            className={`basin-quick-tab-btn ${activeBasinId === 'ALL' ? 'active' : ''}`}
            onClick={() => switchBasin('ALL')}
            data-location-tooltip="All 26 Villages Monitored Across India"
          >
            <span>🌐 ALL</span>
          </button>
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

        {/* District or National Threat Index Meter */}
        <div className="threat-meter-card">
          <div className="threat-header" style={{ fontSize: '0.92rem', fontWeight: 600 }}>
            <span>{activeBasinId === 'ALL' ? 'All-India Average Hazard Index' : `${activeBasin ? activeBasin.state : 'District'} Hazard Index`}</span>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>{avgRisk}%</span>
          </div>
          <div className="threat-bar-container">
            <div className="threat-bar-fill" style={{ width: `${avgRisk}%` }}></div>
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
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
            border: selectedVillageId === null ? '1.5px solid var(--accent-cyan)' : '1px dashed var(--border-color)',
            background: selectedVillageId === null ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.04)'
          }}
          title="Click to view full All-India National Map overview"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                  All-India National View
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedVillageId === null 
                    ? `● ${activeBasinId === 'ALL' ? 'National Overview (All 26 Villages)' : `${activeBasin?.name || 'Active Basin'} Overview`}` 
                    : 'Click to zoom out to India'}
                </div>
              </div>
            </div>
            {selectedVillageId === null && (
              <span className="active-village-pill" style={{ background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px' }}>
                ● OVERVIEW
              </span>
            )}
          </div>
        </div>

        {/* Village List Header & Descending Risk Badge */}
        <div className="village-list-header-row">
          <div className="village-list-header">
            {activeBasinId === 'ALL' 
              ? 'ALL 26 VILLAGES (DESCENDING RISK)' 
              : `${(activeBasin?.name || 'BASIN').toUpperCase()} WARDS (DESCENDING RISK)`}
          </div>
          <span className="triage-sort-pill" title="Sorted in strict descending order by live threat percentage">
            Ranked #1 to #{sortedVillages.length}
          </span>
        </div>

        {/* Descending Triage Ranked Village Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedVillages.map((v, idx) => {
            const isSelected = v.id === selectedVillageId;
            const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'EXTREME';
            const riskPct = v.risk_percentage || 0;
            const radius = 15;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (riskPct / 100) * circumference;
            const ringColor = riskPct >= 70 ? '#ef4444' : riskPct >= 40 ? '#f59e0b' : '#10b981';

            // State abbreviation badge for multi-state view
            const stateTag = v.state?.includes('Himachal') ? 'HP' : 
                             v.state?.includes('Uttarakhand') ? 'UK' : 
                             v.state?.includes('Sikkim') ? 'SK' : 
                             v.state?.includes('Kerala') ? 'KL' : '';

            return (
              <div
                key={v.id}
                className={`village-card ${isSelected ? 'selected' : ''} ${isCritical ? 'severity-critical' : ''}`}
                onClick={() => selectVillage(v.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div className="village-rank-badge" title={`Triage Threat Rank #${idx + 1} (${riskPct}%)`}>
                    #{idx + 1}
                  </div>
                  <div className="village-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4>{v.name}</h4>
                      {stateTag && activeBasinId === 'ALL' && (
                        <span className="village-state-tag" title={v.state}>
                          {stateTag}
                        </span>
                      )}
                      {isSelected && (
                        <span className="active-village-pill">
                          ● ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="village-meta">Elev: {v.elevation_m}m | Slope: {v.slope_deg}°</div>
                    <div className="village-shelter-preview">
                      <span style={{ color: isCritical ? '#dc2626' : 'var(--text-secondary)', fontWeight: 700 }}>
                        ⏳ {v.lead_time_display || '10-30 min'}
                      </span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>⛺ {typeof v.primary_shelter === 'object' && v.primary_shelter !== null ? (v.primary_shelter as any).name : (v.primary_shelter || 'Safe Ridge')}</span>
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
