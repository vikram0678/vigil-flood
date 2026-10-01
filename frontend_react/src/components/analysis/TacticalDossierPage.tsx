import React, { useState, useEffect, useMemo } from 'react';
import { useFlood } from '../../context/FloodContext';
import { 
  HISTORICAL_DISASTER_DATABASE, 
  getSeverityColor, 
  getDisasterTypeIcon, 
  getTotalCasualties,
  type VillageHistoricalData,
  type HistoricalIncident 
} from '../../data/historicalDisasterData';

/**
 * ============================================================================
 * TACTICAL EVACUATION & HISTORICAL DISASTER DOSSIER PAGE
 * ============================================================================
 * 
 * Full-page tactical briefing dashboard that overlays the main app.
 * Accessed via button in the Decision Support & XAI panel.
 * 
 * Sections:
 * 1. Village Header & Risk Classification
 * 2. Historical Disaster Archive (timeline with incidents)
 * 3. Tactical Evacuation Operations (shelters, routes, resources)
 * 4. Catchment Profile & Geological Assessment
 * 5. NDRF/SDRF Resource Allocation Matrix
 */

interface TacticalDossierPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TacticalDossierPage: React.FC<TacticalDossierPageProps> = ({ isOpen, onClose }) => {
  const { selectedVillageId, selectedVillageData, selectVillage } = useFlood();
  const [internalVillageId, setInternalVillageId] = useState<string>(selectedVillageId || 'VIL-01');
  const [activeTab, setActiveTab] = useState<'history' | 'evacuation' | 'catchment'>('history');
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (selectedVillageId) {
      setInternalVillageId(selectedVillageId);
    }
  }, [selectedVillageId]);

  const currentVillageId = selectedVillageId || internalVillageId || 'VIL-01';

  const historicalData: VillageHistoricalData | null = useMemo(() => {
    return HISTORICAL_DISASTER_DATABASE[currentVillageId] || HISTORICAL_DISASTER_DATABASE['VIL-01'] || null;
  }, [currentVillageId]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setActiveTab('history');
      setExpandedIncident(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !historicalData) return null;

  const casualties = getTotalCasualties(currentVillageId);
  const currentRisk = (selectedVillageId === currentVillageId) ? selectedVillageData?.risk_analysis : null;
  const riskLevel = currentRisk?.risk_level || 'MODERATE';
  const riskPct = currentRisk?.risk_percentage ?? historicalData.catchment_profile.vulnerability_index;
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  return (
    <div className={`tactical-dossier-overlay ${isAnimating ? 'active' : ''}`}>
      <div className="tactical-dossier-container">
        {/* ═══════════ TOP COMMAND BAR ═══════════ */}
        <header className="td-command-bar">
          <div className="td-command-left">
            <div className="td-vigil-badge">
              <span className="td-vigil-icon">🛡️</span>
              <span>VIGIL-FLOOD</span>
            </div>
            <div className="td-breadcrumb">
              <span className="td-breadcrumb-sep">›</span>
              <span>Tactical Dossier</span>
              <span className="td-breadcrumb-sep">›</span>
              <select
                className="td-village-dropdown-select"
                value={currentVillageId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setInternalVillageId(newId);
                  selectVillage(newId);
                }}
                title="Select pilot village to view historical & evacuation dossier"
              >
                {Object.entries(HISTORICAL_DISASTER_DATABASE).map(([id, data]) => (
                  <option key={id} value={id}>
                    {data.village_name} ({data.district}, {data.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="td-command-right">
            <div className={`td-threat-pill ${isHighRisk ? 'critical' : 'nominal'}`}>
              <span className="td-threat-dot"></span>
              <span>{isHighRisk ? '🚨 HIGH ALERT' : '🟢 MONITORING'}</span>
            </div>
            <button className="td-close-btn" onClick={onClose} title="Return to Dashboard">
              <span>✕</span>
              <span>Return to Dashboard</span>
            </button>
          </div>
        </header>

        {/* ═══════════ VILLAGE HERO SECTION ═══════════ */}
        <section className="td-hero-section">
          <div className="td-hero-content">
            <div className="td-hero-left">
              <h1 className="td-village-title">{historicalData.village_name}</h1>
              <div className="td-village-meta">
                <span className="td-meta-tag">{historicalData.district}, {historicalData.state}</span>
                <span className="td-meta-tag">{historicalData.ndma_zone_classification}</span>
              </div>
              <p className="td-risk-narrative">{historicalData.risk_narrative}</p>
            </div>
            <div className="td-hero-stats">
              <div className="td-stat-card critical">
                <div className="td-stat-value">{casualties.fatalities}</div>
                <div className="td-stat-label">Total Fatalities (Historical)</div>
              </div>
              <div className="td-stat-card warning">
                <div className="td-stat-value">{casualties.incidents}</div>
                <div className="td-stat-label">Recorded Disasters</div>
              </div>
              <div className="td-stat-card info">
                <div className="td-stat-value">{historicalData.catchment_profile.vulnerability_index}%</div>
                <div className="td-stat-label">Vulnerability Index</div>
              </div>
              <div className="td-stat-card">
                <div className="td-stat-value" style={{ color: isHighRisk ? '#ef4444' : '#10b981' }}>{riskPct}%</div>
                <div className="td-stat-label">Current Live Risk</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ TAB NAVIGATION ═══════════ */}
        <nav className="td-tab-nav">
          <button
            className={`td-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span>📜</span>
            <span>Historical Disaster Archive</span>
          </button>
          <button
            className={`td-tab-btn ${activeTab === 'evacuation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evacuation')}
          >
            <span>🚁</span>
            <span>Tactical Evacuation Ops</span>
          </button>
          <button
            className={`td-tab-btn ${activeTab === 'catchment' ? 'active' : ''}`}
            onClick={() => setActiveTab('catchment')}
          >
            <span>🏔️</span>
            <span>Catchment & Geology Profile</span>
          </button>
        </nav>

        {/* ═══════════ TAB CONTENT ═══════════ */}
        <main className="td-main-content">
          {/* ---- HISTORICAL DISASTER ARCHIVE TAB ---- */}
          {activeTab === 'history' && (
            <div className="td-tab-content td-history-tab">
              <div className="td-section-header">
                <h2>📜 Disaster History Timeline — {historicalData.village_name}</h2>
                <p>Documented incidents from NDMA, SDMA, CWC, GSI & ISRO-NRSC archives</p>
              </div>

              <div className="td-timeline">
                {historicalData.incidents.map((incident: HistoricalIncident, idx: number) => (
                  <div 
                    key={idx} 
                    className={`td-timeline-card ${expandedIncident === idx ? 'expanded' : ''}`}
                    onClick={() => setExpandedIncident(expandedIncident === idx ? null : idx)}
                  >
                    <div className="td-timeline-marker">
                      <div 
                        className="td-timeline-dot"
                        style={{ background: getSeverityColor(incident.severity) }}
                      ></div>
                      <div className="td-timeline-line"></div>
                    </div>

                    <div className="td-timeline-body">
                      <div className="td-timeline-header">
                        <div className="td-timeline-date">
                          <span className="td-timeline-icon">{getDisasterTypeIcon(incident.disaster_type)}</span>
                          <span className="td-timeline-year">{incident.year}</span>
                          <span className="td-timeline-month">{incident.month}</span>
                        </div>
                        <div className="td-timeline-badges">
                          <span 
                            className="td-severity-badge"
                            style={{ 
                              background: `${getSeverityColor(incident.severity)}20`,
                              color: getSeverityColor(incident.severity),
                              borderColor: getSeverityColor(incident.severity)
                            }}
                          >
                            {incident.severity}
                          </span>
                          <span className="td-type-badge">{incident.disaster_type.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      <div className="td-timeline-stats-row">
                        <div className="td-mini-stat fatal">
                          <span className="td-mini-stat-icon">💀</span>
                          <span className="td-mini-stat-val">{incident.fatalities}</span>
                          <span className="td-mini-stat-label">Fatalities</span>
                        </div>
                        <div className="td-mini-stat injured">
                          <span className="td-mini-stat-icon">🏥</span>
                          <span className="td-mini-stat-val">{incident.injured}</span>
                          <span className="td-mini-stat-label">Injured</span>
                        </div>
                        <div className="td-mini-stat damage">
                          <span className="td-mini-stat-icon">🏠</span>
                          <span className="td-mini-stat-val">{incident.houses_damaged}</span>
                          <span className="td-mini-stat-label">Houses</span>
                        </div>
                        <div className="td-mini-stat displaced">
                          <span className="td-mini-stat-icon">🚶</span>
                          <span className="td-mini-stat-val">{incident.displacement.toLocaleString()}</span>
                          <span className="td-mini-stat-label">Displaced</span>
                        </div>
                      </div>

                      {expandedIncident === idx && (
                        <div className="td-incident-detail">
                          <p className="td-incident-desc">{incident.description}</p>
                          <div className="td-incident-source">
                            <span>📋 Source:</span> {incident.source}
                          </div>
                          {incident.image_keywords && (
                            <div className="td-incident-keywords">
                              <span>🔍 Reference Keywords:</span> {incident.image_keywords}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="td-timeline-expand-hint">
                        {expandedIncident === idx ? '▴ Collapse details' : '▾ Click for full briefing'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Strip */}
              <div className="td-history-summary">
                <div className="td-summary-title">⚠️ CUMULATIVE IMPACT ASSESSMENT</div>
                <div className="td-summary-grid">
                  <div className="td-summary-item">
                    <span className="td-summary-val">{casualties.fatalities}</span>
                    <span className="td-summary-lbl">Total Lives Lost</span>
                  </div>
                  <div className="td-summary-item">
                    <span className="td-summary-val">{historicalData.incidents.reduce((s, i) => s + i.injured, 0)}</span>
                    <span className="td-summary-lbl">Total Injured</span>
                  </div>
                  <div className="td-summary-item">
                    <span className="td-summary-val">{historicalData.incidents.reduce((s, i) => s + i.houses_damaged, 0)}</span>
                    <span className="td-summary-lbl">Structures Damaged</span>
                  </div>
                  <div className="td-summary-item">
                    <span className="td-summary-val">{historicalData.incidents.reduce((s, i) => s + i.displacement, 0).toLocaleString()}</span>
                    <span className="td-summary-lbl">Total Displaced</span>
                  </div>
                  <div className="td-summary-item">
                    <span className="td-summary-val">{historicalData.catchment_profile.last_major_event_year}</span>
                    <span className="td-summary-lbl">Last Major Event</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- TACTICAL EVACUATION OPS TAB ---- */}
          {activeTab === 'evacuation' && (
            <div className="td-tab-content td-evac-tab">
              <div className="td-section-header">
                <h2>🚁 Tactical Evacuation Operations — {historicalData.village_name}</h2>
                <p>Pre-positioned assets, safe shelters, and NDRF/SDRF deployment matrix</p>
              </div>

              {/* Alert Banner for High Risk */}
              {isHighRisk && (
                <div className="td-evac-alert-banner">
                  <div className="td-evac-alert-icon">🚨</div>
                  <div>
                    <div className="td-evac-alert-title">EVACUATION READINESS: CRITICAL</div>
                    <div className="td-evac-alert-text">
                      Current risk level is {riskLevel} ({riskPct}%). Pre-deploy NDRF/SDRF teams and activate safe shelters immediately.
                    </div>
                  </div>
                </div>
              )}

              <div className="td-evac-grid">
                {/* Safe Shelters */}
                <div className="td-evac-card shelters">
                  <div className="td-evac-card-header">
                    <span className="td-evac-card-icon">🏕️</span>
                    <h3>Safe Shelters & Relief Camps</h3>
                  </div>
                  <div className="td-shelter-list">
                    {historicalData.evacuation_assets.shelters.map((shelter, idx) => (
                      <div key={idx} className="td-shelter-item">
                        <div className="td-shelter-name">
                          <span className="td-shelter-pin">📍</span>
                          {shelter.name}
                        </div>
                        <div className="td-shelter-meta">
                          <span>👥 Capacity: <strong>{shelter.capacity}</strong></span>
                          <span>⬆️ Elevation: <strong>{shelter.elevation_m}m</strong></span>
                          <span>🏛️ Type: <strong>{shelter.type}</strong></span>
                        </div>
                        <div className="td-shelter-coords">
                          📌 {shelter.lat.toFixed(4)}°N, {shelter.lng.toFixed(4)}°E
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NDRF/SDRF Resource Matrix */}
                <div className="td-evac-card resources">
                  <div className="td-evac-card-header">
                    <span className="td-evac-card-icon">🪖</span>
                    <h3>NDRF/SDRF Deployment Matrix</h3>
                  </div>
                  <div className="td-resource-grid">
                    <div className="td-resource-item">
                      <div className="td-resource-icon">🛡️</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.ndrf_teams_required}</div>
                      <div className="td-resource-label">NDRF Teams</div>
                    </div>
                    <div className="td-resource-item">
                      <div className="td-resource-icon">🪖</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.sdrf_teams_required}</div>
                      <div className="td-resource-label">SDRF Teams</div>
                    </div>
                    <div className="td-resource-item">
                      <div className="td-resource-icon">🚁</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.helicopters_required}</div>
                      <div className="td-resource-label">Helicopters</div>
                    </div>
                    <div className="td-resource-item">
                      <div className="td-resource-icon">🚑</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.ambulances_required}</div>
                      <div className="td-resource-label">Ambulances</div>
                    </div>
                    <div className="td-resource-item">
                      <div className="td-resource-icon">🏥</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.medical_teams}</div>
                      <div className="td-resource-label">Medical Teams</div>
                    </div>
                    <div className="td-resource-item">
                      <div className="td-resource-icon">⏱️</div>
                      <div className="td-resource-val">{historicalData.evacuation_assets.estimated_evacuation_time_hrs}h</div>
                      <div className="td-resource-label">Est. Evacuation Time</div>
                    </div>
                  </div>
                </div>

                {/* Communication Assets */}
                <div className="td-evac-card comms">
                  <div className="td-evac-card-header">
                    <span className="td-evac-card-icon">📡</span>
                    <h3>Communication & Alert Assets</h3>
                  </div>
                  <div className="td-comms-list">
                    {historicalData.evacuation_assets.communication_assets.map((asset, idx) => (
                      <div key={idx} className="td-comms-item">
                        <span className="td-comms-dot">●</span>
                        {asset}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supply Requirements */}
                <div className="td-evac-card supplies">
                  <div className="td-evac-card-header">
                    <span className="td-evac-card-icon">📦</span>
                    <h3>Supply & Logistics Requirements</h3>
                  </div>
                  <div className="td-supply-list">
                    {historicalData.evacuation_assets.supply_requirements.map((item, idx) => (
                      <div key={idx} className="td-supply-item">
                        <span className="td-supply-check">✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- CATCHMENT & GEOLOGY PROFILE TAB ---- */}
          {activeTab === 'catchment' && (
            <div className="td-tab-content td-catchment-tab">
              <div className="td-section-header">
                <h2>🏔️ Catchment & Geological Profile — {historicalData.village_name}</h2>
                <p>Hydrological, geomorphic, and geological baseline assessment</p>
              </div>

              <div className="td-catchment-grid">
                {/* Hydrology Card */}
                <div className="td-catchment-card hydro">
                  <div className="td-catchment-card-header">
                    <span>🌊</span>
                    <h3>Hydrological Parameters</h3>
                  </div>
                  <div className="td-param-list">
                    <div className="td-param-row">
                      <span className="td-param-key">Primary River System</span>
                      <span className="td-param-val">{historicalData.catchment_profile.primary_river}</span>
                    </div>
                    <div className="td-param-row">
                      <span className="td-param-key">Sub-Catchment Area</span>
                      <span className="td-param-val">{historicalData.catchment_profile.catchment_area_km2} km²</span>
                    </div>
                    <div className="td-param-row">
                      <span className="td-param-key">Max Recorded Rainfall (24h)</span>
                      <span className="td-param-val highlight-red">{historicalData.catchment_profile.max_recorded_rainfall_mm} mm</span>
                    </div>
                    <div className="td-param-row">
                      <span className="td-param-key">Avg Annual Monsoon Rainfall</span>
                      <span className="td-param-val">{historicalData.catchment_profile.avg_monsoon_rainfall_mm} mm</span>
                    </div>
                  </div>
                </div>

                {/* Geology Card */}
                <div className="td-catchment-card geo">
                  <div className="td-catchment-card-header">
                    <span>⛰️</span>
                    <h3>Geological Formation</h3>
                  </div>
                  <div className="td-param-list">
                    <div className="td-param-row">
                      <span className="td-param-key">Geological Formation</span>
                      <span className="td-param-val">{historicalData.catchment_profile.geological_formation}</span>
                    </div>
                    <div className="td-param-row">
                      <span className="td-param-key">NDMA Zone</span>
                      <span className="td-param-val">{historicalData.ndma_zone_classification}</span>
                    </div>
                    <div className="td-param-row">
                      <span className="td-param-key">Recurring Threat Pattern</span>
                      <span className="td-param-val highlight-amber">{historicalData.catchment_profile.recurring_threat}</span>
                    </div>
                  </div>
                </div>

                {/* Vulnerability Score Card */}
                <div className="td-catchment-card vulnerability">
                  <div className="td-catchment-card-header">
                    <span>🎯</span>
                    <h3>Composite Vulnerability Assessment</h3>
                  </div>
                  <div className="td-vulnerability-meter">
                    <div className="td-vuln-score">
                      <div className="td-vuln-number" style={{ 
                        color: historicalData.catchment_profile.vulnerability_index >= 80 ? '#ef4444' :
                               historicalData.catchment_profile.vulnerability_index >= 60 ? '#f59e0b' : '#10b981'
                      }}>
                        {historicalData.catchment_profile.vulnerability_index}
                      </div>
                      <div className="td-vuln-label">/ 100</div>
                    </div>
                    <div className="td-vuln-track">
                      <div 
                        className="td-vuln-fill"
                        style={{ 
                          width: `${historicalData.catchment_profile.vulnerability_index}%`,
                          background: historicalData.catchment_profile.vulnerability_index >= 80 
                            ? 'linear-gradient(90deg, #f97316, #ef4444)' 
                            : historicalData.catchment_profile.vulnerability_index >= 60 
                              ? 'linear-gradient(90deg, #eab308, #f97316)'
                              : 'linear-gradient(90deg, #10b981, #eab308)'
                        }}
                      ></div>
                    </div>
                    <div className="td-vuln-classification">
                      {historicalData.catchment_profile.vulnerability_index >= 90 ? '🔴 EXTREMELY VULNERABLE — Immediate Monitoring Priority' :
                       historicalData.catchment_profile.vulnerability_index >= 75 ? '🟠 HIGHLY VULNERABLE — Active Threat Zone' :
                       historicalData.catchment_profile.vulnerability_index >= 60 ? '🟡 MODERATELY VULNERABLE — Enhanced Surveillance Required' :
                       '🟢 LOW-MODERATE VULNERABILITY'}
                    </div>
                  </div>

                  <div className="td-vuln-factors">
                    <h4>Contributing Factors</h4>
                    <div className="td-factor-list">
                      <div className="td-factor-item">
                        <span className="td-factor-bar" style={{ width: `${Math.min(100, historicalData.catchment_profile.avg_monsoon_rainfall_mm / 40)}%` }}></span>
                        <span className="td-factor-label">Rainfall Intensity</span>
                      </div>
                      <div className="td-factor-item">
                        <span className="td-factor-bar" style={{ width: `${Math.min(100, historicalData.catchment_profile.vulnerability_index)}%` }}></span>
                        <span className="td-factor-label">Geological Instability</span>
                      </div>
                      <div className="td-factor-item">
                        <span className="td-factor-bar" style={{ width: `${Math.min(100, casualties.fatalities / 3)}%` }}></span>
                        <span className="td-factor-label">Historical Impact Severity</span>
                      </div>
                      <div className="td-factor-item">
                        <span className="td-factor-bar" style={{ width: `${Math.min(100, 100 - historicalData.catchment_profile.catchment_area_km2 * 1.5)}%` }}></span>
                        <span className="td-factor-label">Exposure & Settlement Density</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="td-footer">
          <div className="td-footer-left">
            <span>VIGIL-FLOOD Tactical Intelligence System</span>
            <span className="td-footer-sep">•</span>
            <span>Sources: NDMA, SDMA, IMD, CWC, GSI, ISRO-NRSC</span>
          </div>
          <div className="td-footer-right">
            <span>Classification: OPERATIONAL INTELLIGENCE</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TacticalDossierPage;
