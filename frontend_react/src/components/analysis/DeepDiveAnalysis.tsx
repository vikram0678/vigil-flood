import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const DeepDiveAnalysis: React.FC = () => {
  const { selectedVillageData, toggleWaterSensor } = useFlood();

  if (!selectedVillageData) {
    return (
      <aside className="panel">
        <div className="panel-header">
          <div className="panel-title">🛡️ Decision Support & XAI</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>🇮🇳 National View</span>
        </div>
        <div className="panel-body">
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📡</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>National Early Warning Status</h4>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>● ALL SYSTEMS OPERATIONAL</div>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              VIGIL-FLOOD is continuously monitoring multi-source atmospheric, hydrological, and IoT telemetry across vulnerable mountain valleys.
            </div>
          </div>

          <div className="threat-meter-card" style={{ marginTop: '10px' }}>
            <div className="threat-header">
              <span>Primary Live Pilot Basin</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>Beas Valley (HP)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              • <b>Active Wards:</b> Pandoh, Aut, Thalot, Nagwain, Hanogi<br/>
              • <b>Monitoring Stack:</b> 3D Elevation Mesh, LoRa IoT Nodes & CWC Gauges<br/>
              • <b>Current Peak Threat:</b> Pandoh Gorge (61% Hazard Index)
            </div>
          </div>

          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px dashed var(--border-color)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Hyper-Local Drill-Down Available
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Click any village from the left sidebar or the map radar marker to inspect real-time IoT sensors, TreeSHAP XAI drivers, and dynamic evacuation paths.
            </div>
          </div>
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
        <div className="panel-title">🛡️ Decision Support & XAI</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {v.name}
        </span>
      </div>

      <div className="panel-body">
        {/* Village Title & Geomorphic Metrics */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.name} • {v.ward}</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Elev: {v.elevation_m}m | Slope: {v.slope_deg}° | Stream Dist: {v.distance_to_stream_m}m | Pop: {v.population}
          </div>
        </div>

        {/* Threat Level & Lead Time Banner */}
        <div className={`banner-risk ${risk.risk_level}`}>
          <div>
            <div className="risk-large-number">{risk.risk_percentage}%</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
              {risk.risk_badge} {risk.risk_level}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Model: {risk.model_type} ({Math.round(risk.confidence_score * 100)}% Conf)
            </div>
          </div>
          <div className="lead-time-box">
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Actionable Window
            </div>
            <div className="lead-time-val">{lead.window_display}</div>
            <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
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
            <div className="telemetry-value">{tel.rain_1h || 0} mm/h</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Soil Saturation</div>
            <div className="telemetry-value">{tel.soil_moisture || 0}%</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Stream Water Level</div>
            <div className="telemetry-value" style={{ color: tel.water_level_m === null ? '#f87171' : undefined }}>
              {tel.water_level_m !== null ? `${tel.water_level_m} m` : 'OFFLINE ⚠️'}
            </div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">Slope Inclinometer</div>
            <div className="telemetry-value">{tel.tilt_deg || 0}°</div>
          </div>
        </div>

        {/* TreeSHAP Explainable AI (XAI) Attribution */}
        <div className="xai-section">
          <div className="xai-title">
            <span>🧠 Explainable AI (TreeSHAP Drivers)</span>
          </div>
          {(risk.explainability || []).map((f: any, idx: number) => {
            const factorName = f.factor || f.display_name || 'Hydrometeorological Factor';
            const pct = f.contribution_pct !== undefined ? f.contribution_pct : (f.impact_percentage !== undefined ? f.impact_percentage : 0);
            return (
              <div key={idx} className="xai-bar-row">
                <div className="xai-bar-label-row">
                  <span>{factorName}</span>
                  <span style={{ fontWeight: 700 }}>{pct}%</span>
                </div>
                <div className="xai-bar-track">
                  <div className="xai-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Sensor Resilience & Fallback Matrix */}
        <div className="sensor-matrix-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              📡 Multi-Sensor Health & Fallback
            </span>
            <button
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                background: '#1e293b',
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

          <div className="sensor-grid">
            {health?.sensors?.map((s, idx) => (
              <div key={idx} className="sensor-item">
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {(s.sensor_type || s.sensor_id || 'Sensor').replace(/_/g, ' ')}
                </span>
                <span className={`sensor-state-badge ${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>

          {health?.fallback_active && (
            <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '6px', lineHeight: 1.4 }}>
              ⚠️ Sensor fault detected: Dispatched <b>{health.model_dispatched || 'FALLBACK_ML_MODEL'}</b> (Rainfall + Soil Infiltration proxy).
            </div>
          )}
        </div>

        {/* Action & Evacuation Directives */}
        <div className="action-box">
          <div className="action-title">
            <span>🚨 NDRF Evacuation Directives</span>
          </div>
          <div className="action-item">
            • <b>Tier:</b> {action?.escalation_tier || action?.ndrf_response_tier || action?.alert_level || 'TIER 1 WATCH'}
          </div>
          <div className="action-item">
            • <b>Primary Safe Shelter:</b> {typeof action?.primary_shelter === 'object' && action.primary_shelter !== null ? action.primary_shelter.name : (typeof action?.primary_shelter === 'string' ? action.primary_shelter : 'Govt Senior Secondary School (Upper Ridge)')}
          </div>
          <div className="action-item">
            • <b>Evacuation Path:</b> {typeof action?.recommended_route === 'object' && action.recommended_route !== null ? action.recommended_route.name : (typeof action?.recommended_route === 'string' ? action.recommended_route : 'Route A (Upper Hill Road via SH-13)')}
          </div>

          <div className="sms-preview-card">
            <div style={{ color: 'var(--accent-cyan)', marginBottom: '2px', fontWeight: 700 }}>
              📢 Citizen SMS Broadcast:
            </div>
            "{action?.simulated_sms_broadcast || action?.public_broadcast || 'Emergency weather advisory active for catchment zone.'}"
          </div>
        </div>
      </div>
    </aside>
  );
};
