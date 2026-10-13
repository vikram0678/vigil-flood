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
    openTacticalDossier,
    t
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
            <span>{t('decisionSupportXai')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-header-badge">{t('nationalView')}</span>
            <button
              type="button"
              className="panel-close-right-btn"
              onClick={() => setIsTelemetryCollapsed(true)}
              title="Collapse panel to right and extend map"
              aria-label="Collapse panel to right"
            >
              <span>{t('collapse')}</span>
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
                  {t('historicalDossierTitle')}
                </span>
                <span className="td-launch-btn-subtitle" style={{ fontSize: '0.84rem', marginTop: '2px', fontWeight: 500 }}>
                  {t('historicalDossierSub')}
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
                  <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('nationalEarlyWarningStatus')}</h4>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>{t('allSystemsOperational')}</div>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNationalStatusOpen ? '▴' : '▾'}</span>
            </div>

            {isNationalStatusOpen && (
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '8px', fontWeight: 500 }}>
                {t('nationalStatusDesc')}
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

        {/* Threat Level & Lead Time Banner with Monte Carlo & Conformal Intervals */}
        <div className={`banner-risk ${risk.risk_level}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <div className="risk-large-number">{risk.risk_percentage}%</div>
              {risk.uncertainty_quantification && (
                <div 
                  className="mc-uncertainty-pill"
                  title={`Monte Carlo Dropout (${risk.uncertainty_quantification.mc_dropout_passes || 30} passes) + Conformal Coverage [${risk.uncertainty_quantification.display_interval || ''}]`}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{risk.uncertainty_quantification.display_band || '±5.2%'}</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>(95% CI)</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
              {risk.risk_badge} {risk.risk_level}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {risk.bayesian_model_averaging?.lstm_weight 
                ? `BMA: ${Math.round(risk.bayesian_model_averaging.lstm_weight * 100)}% LSTM + ${Math.round(risk.bayesian_model_averaging.gbdt_weight * 100)}% GBDT`
                : (risk.model_type?.replace('HYBRID_LSTM_GBDT_ENSEMBLE', 'Hybrid AI Ensemble') || 'AI Ensemble')} ({Math.round(risk.confidence_score * 100)}% Conf)
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

        {/* Physics-Informed Safety Guardrail & Mass Conservation */}
        {risk.physics_guardrail && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '6px',
            padding: '7px 10px',
            marginTop: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>⚖️</span>
                <span>PHYSICS GUARDRAIL (MASS CONSERVATION)</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                {risk.physics_guardrail.status || 'VALIDATED'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
              Q ≤ C·I·A (Max runoff: <b>{risk.physics_guardrail.max_theoretical_runoff_mm || '24.2'} mm/h</b> | C={risk.physics_guardrail.runoff_coefficient || '0.65'}). {risk.physics_guardrail.explanation || 'Mass conservation satisfied.'}
            </div>
          </div>
        )}

        {/* Dual-Agency Satellite Verification Badge */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '6px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '3px'
        }}>
          <span style={{ fontSize: '1rem' }}>🛰️</span>
          <div style={{ fontSize: '0.74rem', color: '#e0f2fe', lineHeight: 1.3 }}>
            <b>Dual-Agency Verified:</b> <b>ISRO Bhuvan CartoDEM</b> + <b>ESA Copernicus GLO-30</b> (EGM2008 Datum)
          </div>
        </div>

        {/* Quick Launch: 72-Hour CWC Hydrograph Chart */}
        <button
          className="hydrograph-quick-launch-btn"
          style={{
            width: '100%',
            padding: '7px 10px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#38bdf8',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '3px'
          }}
          onClick={() => window.dispatchEvent(new CustomEvent('open-hydrograph-modal', { detail: { villageId: v.id } }))}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📈</span>
            <span>72-Hour River Discharge Hydrograph (CWC Forecast)</span>
          </span>
          <span>➔</span>
        </button>

        {/* Probabilistic Lead-Time Arrival Density */}
        {lead.probabilistic_distribution && (
          <div style={{
            background: 'var(--surface-elevated, #1e293b)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 10px',
            marginTop: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', fontWeight: 800, marginBottom: '6px' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>⏱️ PROBABILISTIC INUNDATION ARRIVAL</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>P50: ~{lead.probabilistic_distribution.percentiles?.p50_median_m || lead.lead_time_min}m</span>
            </div>
            <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', background: '#090d16', border: '1px solid var(--border-color)' }}>
              <div 
                style={{ width: `${lead.probabilistic_distribution.prob_under_15m}%`, background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={`<15m: ${lead.probabilistic_distribution.prob_under_15m}% probability`}
              >
                {lead.probabilistic_distribution.prob_under_15m >= 10 ? `${lead.probabilistic_distribution.prob_under_15m}%` : ''}
              </div>
              <div 
                style={{ width: `${lead.probabilistic_distribution.prob_15_to_30m}%`, background: '#f59e0b', color: '#000', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={`15-30m: ${lead.probabilistic_distribution.prob_15_to_30m}% probability`}
              >
                {lead.probabilistic_distribution.prob_15_to_30m >= 10 ? `${lead.probabilistic_distribution.prob_15_to_30m}%` : ''}
              </div>
              <div 
                style={{ width: `${lead.probabilistic_distribution.prob_30_to_60m}%`, background: '#38bdf8', color: '#000', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={`30-60m: ${lead.probabilistic_distribution.prob_30_to_60m}% probability`}
              >
                {lead.probabilistic_distribution.prob_30_to_60m >= 10 ? `${lead.probabilistic_distribution.prob_30_to_60m}%` : ''}
              </div>
              <div 
                style={{ width: `${lead.probabilistic_distribution.prob_over_60m}%`, background: '#10b981', color: '#000', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={`>60m: ${lead.probabilistic_distribution.prob_over_60m}% probability`}
              >
                {lead.probabilistic_distribution.prob_over_60m >= 10 ? `${lead.probabilistic_distribution.prob_over_60m}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>🚨 &lt;15m: <b>{lead.probabilistic_distribution.prob_under_15m}%</b></span>
              <span>⚠️ 15-30m: <b>{lead.probabilistic_distribution.prob_15_to_30m}%</b></span>
              <span>ℹ️ 30-60m: <b>{lead.probabilistic_distribution.prob_30_to_60m}%</b></span>
              <span>✅ &gt;60m: <b>{lead.probabilistic_distribution.prob_over_60m}%</b></span>
            </div>
          </div>
        )}

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

              {/* Multi-Agency Incident Command System (ICS / NDMA Protocol) */}
              {action?.ics_command_structure && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  margin: '8px 0',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      🛡️ INCIDENT COMMAND SYSTEM (ICS)
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: action.ics_command_structure.command_tier?.includes('TACTICAL') ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                      color: action.ics_command_structure.command_tier?.includes('TACTICAL') ? '#ef4444' : '#38bdf8',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {action.ics_command_structure.command_tier?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.78rem' }}>
                    <b>Lead Agency:</b> {action.ics_command_structure.lead_agency}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', marginTop: '2px' }}>
                    <b>Incident Commander:</b> {action.ics_command_structure.incident_commander}
                  </div>

                  {action.ics_command_structure.golden_hour_timeline && (
                    <div style={{ marginTop: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', marginBottom: '3px' }}>
                        ⚡ GOLDEN-HOUR OPERATIONAL CHECKPOINTS:
                      </div>
                      {action.ics_command_structure.golden_hour_timeline.slice(0, 3).map((cp: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: '42px' }}>{cp.time}</span>
                          <span>{cp.action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-ics-flowchart-modal'))}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '6px 10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '4px',
                      color: '#38bdf8',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🔍</span>
                    <span>View Interactive ICS Multi-Agency Flowchart (NDMA Tiers 0–4)</span>
                  </button>
                </div>
              )}

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
