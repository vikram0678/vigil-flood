import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';

export const MethodologyModal: React.FC = () => {
  const { isMethodologyOpen, setMethodologyOpen } = useFlood();
  const [activeTab, setActiveTab] = useState<'sources' | 'physics' | 'fallback' | 'xai'>('sources');

  if (!isMethodologyOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={() => setMethodologyOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>🔬 VIGIL-FLOOD — Scientific Methodology & Dual-Hazard AI Architecture</span>
            <span className="modal-tag">MHA / NDRF</span>
          </div>
          <button className="modal-close-btn" onClick={() => setMethodologyOpen(false)}>&times;</button>
        </div>

        <div className="modal-tabs-nav">
          <button 
            className={`modal-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            🛰️ Multi-Source Ingestion
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === 'physics' ? 'active' : ''}`}
            onClick={() => setActiveTab('physics')}
          >
            ⚡ Physics + AI Fusion
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === 'fallback' ? 'active' : ''}`}
            onClick={() => setActiveTab('fallback')}
          >
            📡 Sensor Outage Fallback
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === 'xai' ? 'active' : ''}`}
            onClick={() => setActiveTab('xai')}
          >
            🧠 XAI & Verification
          </button>
        </div>

        <div className="modal-body-content">
          {activeTab === 'sources' && (
            <div className="modal-tab-pane active">
              <div className="tab-section-title">Multi-Source Hydrometeorological Data Ingestion Matrix</div>
              <div className="tab-desc">
                VIGIL-FLOOD resolves the severe lack of high-altitude mountain sensors by synthesizing real-time satellite telemetry, numerical weather predictions, and IoT ground nodes into a unified spatial tensor.
              </div>

              <table className="methodology-table">
                <thead>
                  <tr>
                    <th>Data Stream</th>
                    <th>Source Provider</th>
                    <th>Resolution</th>
                    <th>Primary Hazard Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Rainfall & Flash Forecast</b></td>
                    <td>IMD Radar + Open-Meteo Alpine NWP</td>
                    <td>Hourly / 0.1°</td>
                    <td><span className="badge-blue">Upstream Cloudburst & Intensity</span></td>
                  </tr>
                  <tr>
                    <td><b>Satellite Soil Moisture</b></td>
                    <td>NASA SMAP L4 Satellite Data</td>
                    <td>0.09° / 3-Hourly</td>
                    <td><span className="badge-amber">Pre-Saturation & Debris Trigger</span></td>
                  </tr>
                  <tr>
                    <td><b>Digital Elevation Model (DEM)</b></td>
                    <td>Copernicus 30m / AW3D30</td>
                    <td>30m Grid</td>
                    <td><span className="badge-green">Hydrological Topo Gradient</span></td>
                  </tr>
                  <tr>
                    <td><b>IoT Stream Stage Gauge</b></td>
                    <td>Ultrasonic Sensor Node (Beas Basin)</td>
                    <td>10-sec Telemetry</td>
                    <td><span className="badge-red">Real-Time River Surge Peak</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="modal-tab-pane active">
              <div className="tab-section-title">Coupled Hydro-Geomorphic Physics & Gradient Boosted ML</div>
              <div className="tab-desc">
                Mountain flash floods are not merely rising water—they are high-velocity surges that trigger secondary debris avalanches. VIGIL-FLOOD runs coupled physics equations alongside an XGBoost + PyTorch Bi-LSTM ensemble.
              </div>

              <div className="physics-grid">
                <div className="physics-card">
                  <div className="phase-num">PHASE 1 • RUNOFF SURGE</div>
                  <h4>Rational Method & Kinematic Routing</h4>
                  <p>Calculates peak catchment discharge (Q = C · I · A) routing water through narrow Himalayan ravines.</p>
                </div>
                <div className="physics-card">
                  <div className="phase-num">PHASE 2 • SLOPE STABILITY</div>
                  <h4>Infinite Slope Debris Equation</h4>
                  <p>Calculates safety factor FS based on pore pressure, cohesion, and friction angle under intense rainfall.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fallback' && (
            <div className="modal-tab-pane active">
              <div className="tab-section-title">Zero Single-Point-of-Failure: Sensor Outage Fallback Engine</div>
              <div className="tab-desc">
                When rugged mountain weather, landslides, or debris knock out river ultrasonic gauges, the system automatically detects the telemetry anomaly and dynamically dispatches the <b>FALLBACK_ML_MODEL</b>.
              </div>

              <div className="piarc-steps-list" style={{ marginTop: '8px' }}>
                <div className="piarc-step-item">
                  <span className="step-badge">STAGE 1</span>
                  <span>Heartbeat & physical range sanity filter detects lost or frozen river gauge readings.</span>
                </div>
                <div className="piarc-step-item">
                  <span className="step-badge">STAGE 2</span>
                  <span>Instant dynamic fallback to satellite soil moisture + radar rainfall infiltration proxy.</span>
                </div>
                <div className="piarc-step-item">
                  <span className="step-badge">STAGE 3</span>
                  <span>Authority dashboard flags degraded telemetry while preserving life-saving alerts.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xai' && (
            <div className="modal-tab-pane active">
              <div className="tab-section-title">Explainable AI (TreeSHAP) & NDRF Decision Transparency</div>
              <div className="tab-desc">
                Disaster commanders cannot act on "black box" numbers. TreeSHAP attribution decomposes every prediction into exact mathematical percentage contributions from rainfall, slope, soil, and river stage.
              </div>

              <div className="usps-grid" style={{ marginTop: '8px' }}>
                <div className="usp-card">
                  <h4>Transparent Action Triggers</h4>
                  <p>Commanders see exactly why an alert escalated to CRITICAL, removing guesswork during night cloudbursts.</p>
                </div>
                <div className="usp-card">
                  <h4>Clear Lead-Time Windows</h4>
                  <p>Provides actionable 10–30 min evacuation windows mapped directly to pre-designated uphill shelters.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
