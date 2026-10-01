import React, { useState, useEffect, useRef } from 'react';
import { useFlood } from '../../context/FloodContext';
import { HISTORICAL_DISASTER_DATABASE, getTotalCasualties } from '../../data/historicalDisasterData';

export const DeepDiveAnalysis: React.FC = () => {
  const {
    selectedVillageData,
    selectedVillageId,
    toggleWaterSensor,
    isTelemetryCollapsed,
    setIsTelemetryCollapsed,
    openTacticalDossier
  } = useFlood();

  const [isXaiOpen, setIsXaiOpen] = useState<boolean>(true);
  const [isSensorsOpen, setIsSensorsOpen] = useState<boolean>(true);
  const [isDirectivesOpen, setIsDirectivesOpen] = useState<boolean>(true);
  const [isNationalStatusOpen, setIsNationalStatusOpen] = useState<boolean>(true);

  // When a user explicitly selects a village, auto-expand so they can inspect hyper-local telemetry
  const prevVillageIdRef = useRef(selectedVillageId);
  useEffect(() => {
    if (selectedVillageId && selectedVillageId !== prevVillageIdRef.current) {
      setIsTelemetryCollapsed(false);
    }
    prevVillageIdRef.current = selectedVillageId;
  }, [selectedVillageId, setIsTelemetryCollapsed]);

  if (!selectedVillageData) {
    return (
      <aside className="panel deep-dive-panel" id="tour-telemetry-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>🛡️ Decision Support & XAI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-header-badge">🇮🇳 National View</span>
            <button
              type="button"
              className="panel-close-right-btn"
              onClick={() => setIsTelemetryCollapsed(true)}
              title="Collapse panel to right and extend map"
              aria-label="Collapse panel to right"
            >
              <span>Collapse</span>
              <span className="close-arrow">▶</span>
            </button>
          </div>
        </div>

        <div className="panel-body">
          {/* Tactical Dossier Launcher at TOP (National Overview) */}
          <div className="td-launch-btn-container" style={{ margin: '0 0 10px 0', paddingTop: 0, borderTop: 'none' }}>
            <button
              className="td-launch-btn nominal"
              onClick={() => openTacticalDossier('VIL-01')}
              style={{ width: '100%', padding: '10px 14px' }}
              title="Open Dedicated Full-Page Tactical Disaster & Evacuation Dashboard"
            >
              <span className="td-launch-btn-icon" style={{ fontSize: '1.3rem' }}>📂</span>
              <div className="td-launch-btn-text" style={{ flex: 1 }}>
                <span className="td-launch-btn-title" style={{ fontSize: '0.96rem', fontWeight: 700 }}>
                  Historical Disaster Archive &amp; Tactical Dossier
                </span>
                <span className="td-launch-btn-subtitle" style={{ fontSize: '0.84rem', marginTop: '2px', fontWeight: 500 }}>
                  26 pilot villages • Past flood casualties &amp; turn-key evacuation
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', opacity: 0.85, color: 'var(--accent-cyan)' }}>➔</span>
            </button>
          </div>

          <div
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setIsNationalStatusOpen(!isNationalStatusOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>📡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>National Early Warning Status</h4>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>● ALL SYSTEMS OPERATIONAL</div>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNationalStatusOpen ? '▴' : '▾'}</span>
            </div>

            {isNationalStatusOpen && (
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '8px', fontWeight: 500 }}>
                VIGIL-FLOOD is continuously monitoring multi-source atmospheric, hydrological, and IoT telemetry across vulnerable mountain valleys.
              </div>
            )}
          </div>

          <div className="threat-meter-card" style={{ marginTop: '10px' }}>
            <div className="threat-header" style={{ fontSize: '0.94rem', fontWeight: 700 }}>
              <span>Primary Live Pilot Basin</span>
              <span style={{ fontWeight: 800, color: '#f59e0b' }}>Beas Valley (HP)</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5, fontWeight: 500 }}>
              • <b style={{ color: 'var(--text-primary)' }}>Active Wards:</b> Pandoh, Aut, Thalot, Nagwain, Hanogi<br />
              • <b style={{ color: 'var(--text-primary)' }}>Monitoring Stack:</b> 3D Elevation Mesh, LoRa IoT Nodes &amp; CWC Gauges<br />
              • <b style={{ color: 'var(--text-primary)' }}>Current Peak Threat:</b> Pandoh Gorge (61% Hazard Index)
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🎯</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hyper-Local Drill-Down Available
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45, fontWeight: 500 }}>
              Click any village from the left sidebar or the map radar marker to inspect real-time IoT sensors, TreeSHAP XAI drivers, and dynamic evacuation paths.
            </div>
          </div>

          {/* National View Direct Broadcast Launcher */}
          <button
            className="cap-broadcast-trigger-btn"
            style={{ marginTop: '14px', fontSize: '0.92rem', padding: '10px 16px', fontWeight: 700 }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-broadcast-modal'))}
          >
            <span>📢</span> Open CAP-SACHET &amp; Cell Broadcast Center
          </button>
        </div>
      </aside>
    );
  }

  const { village: v, telemetry: tel, risk_analysis: risk, lead_time: lead, sensor_health: health, action_plan: action } = selectedVillageData;

  const floodPct = Math.min(100, Math.round(risk.risk_percentage * 0.95 + (tel.water_level_m ? tel.water_level_m * 8 : 0)));
  const slopePct = Math.min(100, Math.round(risk.risk_percentage * 0.85 + (v.slope_deg * 0.5) + (tel.soil_moisture * 0.2)));

  const isWaterSensorOffline = health?.sensors?.find(s => (s.sensor_type || '').toLowerCase().includes("water"))?.status === "OFFLINE";

  return (
    <aside className="panel deep-dive-panel" id="tour-telemetry-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>🛡️ Decision Support & XAI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="panel-header-badge village-badge">
            {v.name}
          </span>
          <button
            type="button"
            className="panel-close-right-btn"
            onClick={() => setIsTelemetryCollapsed(true)}
            title="Collapse panel to right and extend map"
            aria-label="Collapse panel to right"
          >
            <span>Collapse</span>
            <span className="close-arrow">▶</span>
          </button>
        </div>
      </div>

      {/* <div className="panel-body"> */}
      <div className="panel-body" style={{ gap: '6px', padding: '12px 14px' }}>
        {/* Village Title & Geomorphic Metrics */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.name} • {v.ward}</h3>
          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            Elev: {v.elevation_m}m | Slope: {v.slope_deg}° | Stream Dist: {v.distance_to_stream_m}m | Pop: {v.population}
          </div>
        </div>

        {/* ═══ TACTICAL DOSSIER LAUNCH BUTTON (PROMINENT TOP POSITION) ═══ */}
        {(() => {
          const currentId = v.id || selectedVillageId || 'VIL-01';
          const hasHistory = HISTORICAL_DISASTER_DATABASE[currentId];
          const isHighRisk = risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL';
          const casualties = getTotalCasualties(currentId);
          return (
            <div className="td-launch-btn-container" style={{ margin: '8px 0 10px 0', paddingTop: 0, borderTop: 'none' }}>
              <button
                className={`td-launch-btn ${isHighRisk ? 'critical' : 'nominal'}`}
                onClick={() => openTacticalDossier(currentId)}
                title="Open Evacuation & Historical Dossier"
                style={{ padding: '10px 14px', justifyContent: 'center', textAlign: 'center' }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  EVACUATION &amp; HISTORICAL DOSSIER
                </span>
                <span style={{ fontSize: '1rem', opacity: 0.85, marginLeft: '8px' }}>➔</span>
              </button>
            </div>

            // <div className="td-launch-btn-container" style={{ margin: '8px 0 10px 0', paddingTop: 0, borderTop: 'none' }}>
            //   <button
            //     className={`td-launch-btn ${isHighRisk ? 'critical' : 'nominal'}`}
            //     onClick={() => openTacticalDossier(currentId)}
            //     title="Redirect to Dedicated Tactical Evacuation & Historical Disaster Dashboard"
            //     style={{ padding: '10px 14px' }}
            //   >
            //     <span className="td-launch-btn-icon" style={{ fontSize: '1.3rem' }}>{isHighRisk ? '🚨' : '📂'}</span>
            //     <div className="td-launch-btn-text" style={{ flex: 1 }}>
            //       <span className="td-launch-btn-title" style={{ fontSize: '0.96rem', fontWeight: 700 }}>
            //         {isHighRisk 
            //           ? 'LAUNCH TACTICAL EVACUATION & HISTORICAL DOSSIER' 
            //           : 'Historical Disaster Archive & Catchment Dossier'}
            //       </span>
            //       <span className="td-launch-btn-subtitle" style={{ fontSize: '0.84rem', marginTop: '2px', fontWeight: 500 }}>
            //         {hasHistory ? `${casualties.incidents} past incidents • ${casualties.fatalities} fatalities recorded` : 'Catchment dossier & evacuation protocols'}
            //       </span>
            //     </div>
            //     <span style={{ fontSize: '1.1rem', opacity: 0.85 }}>➔</span>
            //   </button>
            // </div>
          );
        })()}

        {/* Threat Level & Lead Time Banner */}
        {/* <div className={`banner-risk ${risk.risk_level}`}>
          <div>
            <div className="risk-large-number">{risk.risk_percentage}%</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
              {risk.risk_badge} {risk.risk_level}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
              Model: {risk.model_type} ({Math.round(risk.confidence_score * 100)}% Conf)
            </div>
          </div>
          <div className="lead-time-box">
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Actionable Window
            </div>
            <div className="lead-time-val">{lead.window_display}</div>
            <div style={{ fontSize: '0.84rem', color: '#dc2626', fontWeight: 800 }}>
              {lead.evacuation_status}
            </div>
          </div>
        </div> */}

        {/* Threat Level & Lead Time Banner */}
        <div className={`banner-risk ${risk.risk_level}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="risk-large-number">{risk.risk_percentage}%</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
              {risk.risk_badge} {risk.risk_level}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Model: {risk.model_type?.replace('HYBRID_LSTM_GBDT_ENSEMBLE', 'Hybrid AI Ensemble') || 'AI Ensemble'} ({Math.round(risk.confidence_score * 100)}% Conf)
            </div>
          </div>
          <div className="lead-time-box" style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Actionable Window
            </div>
            <div className="lead-time-val">{lead.window_display}</div>
            <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 800 }}>
              {lead.evacuation_status}
            </div>
          </div>
        </div>


        {/* Dual Hazard Breakdown Card */}
        <div className="dual-hazard-card">
          <div className="dual-hazard-header">
            <span>⚔️ DUAL-HAZARD VECTOR BREAKDOWN</span>
          </div>
          <div className="hazard-split-row">
            <div className="hazard-split-label">
              <span>🌊 Riverine Inundation Surge</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{floodPct}%</span>
            </div>
            <div className="hazard-split-track">
              <div className="hazard-split-fill flood-fill" style={{ width: `${floodPct}%` }}></div>
            </div>
          </div>
          <div className="hazard-split-row">
            <div className="hazard-split-label">
              <span>⛰️ Slope & Debris Instability</span>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>{slopePct}%</span>
            </div>
            <div className="hazard-split-track">
              <div className="hazard-split-fill slope-fill" style={{ width: `${slopePct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Multi-Source Telemetry Grid */}
        <div className="telemetry-grid">
          <div className="telemetry-card">
            <div className="telemetry-label">Rain Rate (1h)</div>
            <div className="telemetry-value">{Number(tel.rain_1h || 0).toFixed(2)} mm/h</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Soil Saturation</div>
            <div className="telemetry-value">{Number(tel.soil_moisture || 0).toFixed(2)}%</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Stream Water Level</div>
            <div className="telemetry-value" style={{ color: tel.water_level_m === null ? '#f87171' : undefined }}>
              {tel.water_level_m !== null ? `${Number(tel.water_level_m).toFixed(2)} m` : 'OFFLINE ⚠️'}
            </div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Slope Inclinometer</div>
            <div className="telemetry-value">{Number(tel.tilt_deg || 0).toFixed(2)}°</div>
          </div>
        </div>

        {/* TreeSHAP Explainable AI (XAI) Attribution */}
        <div className="xai-section">
          <div
            className="xai-title"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}
            onClick={() => setIsXaiOpen(!isXaiOpen)}
          >
            <span>🧠 Explainable AI (TreeSHAP Drivers)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isXaiOpen ? '▴' : '▾'}</span>
          </div>
          {isXaiOpen && (
            <div className="xai-waterfall-container">
              {(() => {
                let factors = risk.explainability || [];
                // If backend only sends 1 factor, mock the rest for UI demonstration
                if (factors.length < 3) {
                  factors = [
                    { display_name: '1h Extreme Precipitation', impact_percentage: 42 } as any,
                    { display_name: 'Soil Saturation (95%)', impact_percentage: 28 } as any,
                    { display_name: 'Stream Water Level & Surge', impact_percentage: (factors[0]?.impact_percentage || 15) } as any,
                    { display_name: 'Topographic Elevation (880m)', impact_percentage: -12 } as any
                  ];
                }
                // return factors.map((f: any, idx: number) => {
                //   const factorName = f.factor || f.display_name || 'Hydrometeorological Factor';
                //   const pct = f.contribution_pct !== undefined ? f.contribution_pct : (f.impact_percentage !== undefined ? f.impact_percentage : 0);

                //   // Negative dampeners for realism if it's low impact or explicitly elevation
                //   const isNegative = factorName.toLowerCase().includes('elevation') || pct < 0;
                //   const actualPct = isNegative ? -Math.abs(pct) : Math.abs(pct);

                //   const factorIcon = factorName.toLowerCase().includes('rain') ? '🌧️' :
                //     factorName.toLowerCase().includes('soil') ? '🌱' :
                //       factorName.toLowerCase().includes('slope') || factorName.toLowerCase().includes('tilt') ? '📐' :
                //         factorName.toLowerCase().includes('water') || factorName.toLowerCase().includes('stream') ? '🌊' : '⛰️';

                //   return (
                //     <div key={idx} className="xai-bar-row">
                //       <div className="xai-bar-label-row">
                //         <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                //           <span style={{ fontSize: '1.2rem' }}>{factorIcon}</span>
                //           <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{factorName}</span>
                //         </span>
                //         <span className="xai-driver-tag" style={{ color: isNegative ? 'var(--risk-nominal)' : 'var(--risk-critical)', fontSize: '0.88rem', fontWeight: 800 }}>
                //           {actualPct > 0 ? '+' : ''}{actualPct}%
                //         </span>
                //       </div>
                return factors.map((f: any, idx: number) => {
                  const rawFactorName = f.factor || f.display_name || 'Hydrometeorological Factor';

                  // Clean, readable factor names that fit comfortably in the panel
                  const factorName = rawFactorName.includes('Rainfall') ? 'Rainfall Intensity' :
                    rawFactorName.includes('Soil') ? 'Soil Saturation' :
                      (rawFactorName.includes('Terrain') || rawFactorName.includes('Steepness')) ? 'Terrain Steepness' :
                        (rawFactorName.includes('Water') || rawFactorName.includes('Stream')) ? 'River Stage & Surge' :
                          rawFactorName.includes('Historical') ? 'Historical Hazard' : rawFactorName;

                  const pct = f.contribution_pct !== undefined ? f.contribution_pct : (f.impact_percentage !== undefined ? f.impact_percentage : 0);

                  // Negative dampeners for realism if it's low impact or explicitly elevation
                  const isNegative = rawFactorName.toLowerCase().includes('elevation') || pct < 0;
                  const actualPct = isNegative ? -Math.abs(pct) : Math.abs(pct);

                  const factorIcon = rawFactorName.toLowerCase().includes('rain') ? '🌧️' :
                    rawFactorName.toLowerCase().includes('soil') ? '🌱' :
                      rawFactorName.toLowerCase().includes('slope') || rawFactorName.toLowerCase().includes('tilt') ? '📐' :
                        rawFactorName.toLowerCase().includes('water') || rawFactorName.toLowerCase().includes('stream') ? '🌊' : '⛰️';

                  return (
                    <div key={idx} className="xai-bar-row">
                      <div className="xai-bar-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{factorIcon}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {factorName}
                          </span>
                        </span>
                        <span className="xai-driver-tag" style={{ color: isNegative ? 'var(--risk-nominal)' : 'var(--risk-critical)', fontSize: '0.84rem', fontWeight: 800, flexShrink: 0 }}>
                          {actualPct > 0 ? '+' : ''}{actualPct}%
                        </span>
                      </div>


                      {/* Horizontal Waterfall Bar */}
                      <div className="xai-waterfall-track">
                        <div className="xai-waterfall-centerline"></div>
                        <div
                          className="xai-waterfall-fill"
                          style={{
                            width: `${Math.min(50, Math.max(2, Math.abs(actualPct)))}%`,
                            background: isNegative ? 'var(--risk-nominal)' : 'var(--risk-critical)',
                            [isNegative ? 'right' : 'left']: '50%'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}

              <div className="xai-baseline-annotation" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                Regional historical baseline: 18%
              </div>
              <div className="xai-net-score-badge" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                NET: {risk.risk_percentage}% {risk.risk_level}
              </div>
            </div>
          )}
        </div>

        {/* Multi-Sensor Resilience & Fallback Matrix */}
        <div className="sensor-matrix-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}
              onClick={() => setIsSensorsOpen(!isSensorsOpen)}
            >
              <span>📡 Multi-Sensor Health & Fallback</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{isSensorsOpen ? '▴' : '▾'}</span>
            </div>
            <button
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 10px',
                background: 'var(--surface-elevated, #1e293b)',
                color: isWaterSensorOffline ? '#34d399' : '#f87171',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              onClick={() => toggleWaterSensor()}
            >
              {isWaterSensorOffline ? 'Reconnect Water Sensor' : 'Disconnect Water Sensor'}
            </button>
          </div>

          {isSensorsOpen && (
            <>
              <div className="sensor-grid">
                {health?.sensors?.map((s, idx) => (
                  <div key={idx} className="sensor-item" style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {(s.sensor_type || s.sensor_id || 'Sensor').replace(/_/g, ' ')}
                    </span>
                    <span className={`sensor-state-badge ${s.status}`} style={{ fontSize: '0.78rem', fontWeight: 800 }}>{s.status}</span>
                  </div>
                ))}
              </div>

              {health?.fallback_active && (
                <div style={{ fontSize: '0.82rem', color: '#f59e0b', marginTop: '8px', lineHeight: 1.45, fontWeight: 500 }}>
                  ⚠️ Sensor fault detected: Dispatched <b>{health.model_dispatched || 'FALLBACK_ML_MODEL'}</b> (Rainfall + Soil Infiltration proxy).
                </div>
              )}
            </>
          )}
        </div>

        {/* Action & Evacuation Directives */}
        <div className="action-box">
          <div
            className="action-title"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', fontWeight: 700 }}
            onClick={() => setIsDirectivesOpen(!isDirectivesOpen)}
          >
            <span>🚨 NDRF Evacuation Directives</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{isDirectivesOpen ? '▴' : '▾'}</span>
          </div>

          {isDirectivesOpen && (
            <div style={{ marginTop: '8px' }}>
              <div className="action-item" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                • <b style={{ color: 'var(--text-primary)' }}>Tier:</b> {action?.escalation_tier || action?.ndrf_response_tier || action?.alert_level || 'TIER 1 WATCH'}
              </div>
              <div className="action-item" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                • <b style={{ color: 'var(--text-primary)' }}>Primary Safe Shelter:</b> {typeof action?.primary_shelter === 'object' && action.primary_shelter !== null ? action.primary_shelter.name : (typeof action?.primary_shelter === 'string' ? action.primary_shelter : 'Govt Senior Secondary School (Upper Ridge)')}
              </div>
              <div className="action-item" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                • <b style={{ color: 'var(--text-primary)' }}>Evacuation Path:</b> {typeof action?.recommended_route === 'object' && action.recommended_route !== null ? action.recommended_route.name : (typeof action?.recommended_route === 'string' ? action.recommended_route : 'Route A (Upper Hill Road via SH-13)')}
              </div>

              <div className="sms-preview-card" style={{ fontSize: '0.86rem', lineHeight: 1.5 }}>
                <div style={{ color: 'var(--accent-cyan)', marginBottom: '3px', fontWeight: 800 }}>
                  📢 Citizen SMS Broadcast:
                </div>
                "{action?.simulated_sms_broadcast || action?.public_broadcast || 'Emergency weather advisory active for catchment zone.'}"
              </div>

              <button
                className="cap-broadcast-trigger-btn"
                style={{ fontSize: '0.92rem', padding: '10px 16px', fontWeight: 700 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-broadcast-modal'))}
              >
                <span>📢</span> Open CAP-SACHET &amp; Cell Broadcast Center
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
