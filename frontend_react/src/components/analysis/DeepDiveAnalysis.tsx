import React from 'react';
import { useFlood } from '../../context/FloodContext';

export const DeepDiveAnalysis: React.FC = () => {
  const { selectedVillageData, toggleWaterSensor } = useFlood();

  if (!selectedVillageData) {
    return (
      <aside className="panel">
        <div className="panel-header">
          <div className="panel-title">🛡️ Decision Support</div>
        </div>
        <div className="panel-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading Telemetry...</div>
        </div>
      </aside>
    );
  }

  const { village: v, telemetry: tel, risk_analysis: risk, lead_time: lead, sensor_health: health, action_plan: action } = selectedVillageData;

  const floodPct = Math.min(100, Math.round(risk.risk_percentage * 0.95 + (tel.water_level_m ? tel.water_level_m * 8 : 0)));
  const slopePct = Math.min(100, Math.round(risk.risk_percentage * 0.85 + (v.slope_deg * 0.5) + (tel.soil_moisture * 0.2)));

  const isWaterSensorOffline = health.sensors.find(s => s.type.includes("WATER"))?.status === "OFFLINE";

  return (
    <aside className="panel">
      <div className="panel-header">
        <div className="panel-title">🛡️ Decision Support & XAI</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {v.name}
        </span>
      </div>

      <div className="panel-body">
        {/* Village Title & Geomorphic Metrics */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.name} ({v.ward})</h3>
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
          {risk.explainability.map((f, idx) => (
            <div key={idx} className="xai-bar-row">
              <div className="xai-bar-label-row">
                <span>{f.display_name}</span>
                <span style={{ fontWeight: 700 }}>{f.impact_percentage}%</span>
              </div>
              <div className="xai-bar-track">
                <div className="xai-bar-fill" style={{ width: `${f.impact_percentage}%` }}></div>
              </div>
            </div>
          ))}
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
            {health.sensors.map((s, idx) => (
              <div key={idx} className="sensor-item">
                <span style={{ color: 'var(--text-secondary)' }}>{s.type}</span>
                <span className={`sensor-state-badge ${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>

          {health.is_fallback_active && (
            <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '6px', lineHeight: 1.4 }}>
              ⚠️ Sensor fault detected: Dispatched <b>{health.model_dispatched}</b> (Rainfall + Soil Infiltration proxy).
            </div>
          )}
        </div>

        {/* Action & Evacuation Directives */}
        <div className="action-box">
          <div className="action-title">
            <span>🚨 NDRF Evacuation Directives</span>
          </div>
          <div className="action-item">• <b>Tier:</b> {action.ndrf_response_tier}</div>
          <div className="action-item">• <b>Primary Safe Shelter:</b> {action.primary_shelter}</div>
          <div className="action-item">• <b>Evacuation Path:</b> {action.recommended_route}</div>

          <div className="sms-preview-card">
            <div style={{ color: 'var(--accent-cyan)', marginBottom: '2px', fontWeight: 700 }}>
              📢 Citizen SMS Broadcast:
            </div>
            "{action.public_broadcast}"
          </div>
        </div>
      </div>
    </aside>
  );
};
