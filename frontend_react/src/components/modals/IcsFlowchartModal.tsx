import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const IcsFlowchartModal: React.FC = () => {
  const { selectedVillageData, selectedVillageId, villages } = useFlood();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTier, setActiveTier] = useState<number>(3);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ics-flowchart-modal', handleOpen);
    return () => window.removeEventListener('open-ics-flowchart-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  const village = selectedVillageData?.village || villages[0];
  const risk = selectedVillageData?.risk_analysis;
  const action = selectedVillageData?.action_plan;
  const ics = action?.ics_command_structure;
  const logistics = selectedVillageData?.action_plan?.disaster_logistics || selectedVillageData?.demographics;

  const currentTierNumber = risk?.risk_level === 'CRITICAL' ? 3 : risk?.risk_level === 'HIGH' ? 2 : risk?.risk_level === 'MODERATE' ? 1 : 0;

  const tiers = [
    {
      tierNumber: 4,
      tierCode: "TIER 4: NATIONAL APEX (NCMC / NDMA)",
      authority: "Cabinet Secretary & Vice Chairman, NDMA",
      leadAgency: "National Crisis Management Committee (NCMC) & Ministry of Home Affairs (MHA)",
      deployment: "Multi-State NDRF Battalions, IAF Mi-17 / ALH Helicopter Airlifts, Indian Army Western Command",
      comms: "ISRO GSAT-7 Disaster Satcomms, Terrestrial Optical Fiber Backhaul, Inmarsat C Satphones",
      trigger: "Catastrophic multi-district cloudburst surge, dam crest overtopping, state capacity exceeded (>50,000 exposed)",
      actions: [
        "National Emergency Action Plan activation under Section 35 of DMA 2005",
        "IAF helicopter tactical winch rescue operations over submerged gorges",
        "National Disaster Response Reserve airlift of bailey bridge kits & water purification units",
        "Prime Minister's National Relief Fund (PMNRF) financial tranche mobilization"
      ]
    },
    {
      tierNumber: 3,
      tierCode: "TIER 3: STATE SDMA & TACTICAL NDRF",
      authority: "Chief Secretary & State Relief Commissioner",
      leadAgency: "National Disaster Response Force (NDRF 14th Bn) & State Disaster Response Force (SDRF)",
      deployment: "4 NDRF Teams (135 swift-water personnel), 16 Zodiac Inflatable Rescue Boats, 12 ALS Ambulances",
      comms: "POLNET Satellite VHF/UHF Trunking, CAP-SACHET Cell Broadcast Server, DEOC Hotline",
      trigger: "Critical flash flood probability (Risk > 75%), village stream stage breaching CWC Danger Level (3.8m)",
      actions: [
        "Evacuation enforcement of red hazard perimeter (WorldPop validated residents)",
        "Pre-positioning swift-water zodiac rescue teams along Beas / Mandakini river bends",
        "Police checkpoint road barricade on submerged highways (SH-13 / NH-3)",
        "Staging designated high-ground refuge center with Sphere potable water & pediatric triage"
      ]
    },
    {
      tierNumber: 2,
      tierCode: "TIER 2: DISTRICT EOC (DEOC) & SDM",
      authority: "Deputy Commissioner / District Magistrate (DC Mandi)",
      leadAgency: "District Disaster Management Authority (DDMA) & Sub-Divisional Magistrate (SDM)",
      deployment: "District QRT First Responders, PWD Heavy Excavators, 8 Evacuation Bus Fleets, Red Cross",
      comms: "District EOC Control Room Hotline (1077), Mobile Satellite Van, WhatsApp DEOC Grid",
      trigger: "High hazard advisory (Risk > 50%), torrential 1h rain (>50mm/h) or upstream cascade surge alert",
      actions: [
        "Issue 'Go-Bag' readiness alerts to vulnerable households via local SMS broadcast",
        "Mobilize designated school buses to designated safe evacuation muster points",
        "Clear drainage bottlenecks, nullahs, and road culverts using PWD JCB excavators",
        "Stage pediatric kits and wheelchair-adapted transport for vulnerable seniors"
      ]
    },
    {
      tierNumber: 1,
      tierCode: "TIER 1: TEHSIL & BLOCK EOC (BEOC)",
      authority: "Sub-Divisional Magistrate (SDM) / Block Development Officer (BDO)",
      leadAgency: "Tehsil Administration, Primary Health Center (PHC), & Block Development Office",
      deployment: "Local Police Chowki, 2 PHC 108 Ambulances, Village Revenue Officers (Patwaris)",
      comms: "Local Wireless VHF Radio, Mobile Telephony, Community WhatsApp Alert Group",
      trigger: "Moderate hazard monitoring (Risk > 30%), persistent rainfall with high soil saturation (>60%)",
      actions: [
        "Advise tourists, cattle grazers, and stone crushers to immediately evacuate riverbed flats",
        "Place Primary Health Center (PHC) medical officers and ambulance staff on warm standby",
        "Verify freeboard clearance margin on local bridges and low-water causeways",
        "Log hourly rainfall percolation rates and notify upstream dam control rooms"
      ]
    },
    {
      tierNumber: 0,
      tierCode: "TIER 0: GRAM PANCHAYAT & AAPDA MITRA",
      authority: "Gram Panchayat Pradhan & Ward Members",
      leadAgency: "Community Aapda Mitra Volunteer Corps & Local Disaster Management Committee",
      deployment: "15 Trained Aapda Mitra First Responders, Village Crier / Loudspeaker System, Local Siren",
      comms: "Village Siren, Temple/Mosque Public Loudspeakers, Peer-to-Peer Door Knocks",
      trigger: "Initial automated telemetry threshold pulse or local heavy mountain cloud cover",
      actions: [
        "Sound community solar-powered emergency siren upon automated AI alert",
        "Door-to-door escort assistance for infants (<5y) and elderly (>65y) to safe high ground",
        "Guide residents along Copernicus DEM-verified uphill routes away from nullahs",
        "Report real-time visual water surge telemetry back to Tehsil EOC via Aapda Mitra app"
      ]
    }
  ];

  return (
    <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
      <div 
        className="modal-box modal-ics-flowchart" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Multi-Agency Incident Command System (ICS / NDMA Protocol)
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                National Disaster Management Act (DMA 2005) Golden-Hour Escalation Hierarchy
              </div>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-content" style={{ padding: '16px 22px' }}>
          {/* Active Incident Status Header */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Sector &amp; Hazard Level
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                📍 {village.name} ({village.district || 'Mandi'}, {village.state || 'Himachal Pradesh'})
              </div>
              <div style={{ fontSize: '0.82rem', color: risk?.risk_level === 'CRITICAL' ? '#ef4444' : risk?.risk_level === 'HIGH' ? '#f97316' : '#34d399', fontWeight: 700, marginTop: '2px' }}>
                Hazard Index: {risk?.risk_percentage || 74}% • Active Escalation: Tier {currentTierNumber}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NDRF TEAMS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>{logistics?.ndrf_teams_required || 2} Teams</div>
              </div>
              <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>EVAC BUSES</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{logistics?.evacuation_buses_needed || 6} Units</div>
              </div>
              <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AMBULANCES</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444' }}>{logistics?.ambulances_required || 4} ALS</div>
              </div>
            </div>
          </div>

          {/* Interactive Tier Flowchart Diagram */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              ⚡ Operational Command Hierarchy (Click any Tier to inspect deployment protocol)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tiers.map((t, idx) => {
                const isSelected = activeTier === t.tierNumber;
                const isLiveActive = currentTierNumber === t.tierNumber;
                const tierColor = t.tierNumber >= 3 ? '#ef4444' : t.tierNumber === 2 ? '#f97316' : t.tierNumber === 1 ? '#eab308' : '#10b981';

                return (
                  <div key={idx}>
                    <div 
                      onClick={() => setActiveTier(t.tierNumber)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#0f172a',
                        border: isSelected ? `2px solid ${tierColor}` : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isLiveActive ? `0 0 15px ${tierColor}40` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            background: tierColor,
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            {t.tierCode.split(':')[0]}
                          </span>
                          <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {t.tierCode.split(':')[1]}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isLiveActive && (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              ● CURRENT TRIGGER LEVEL
                            </span>
                          )}
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{isSelected ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Summary Subline */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                        <b>Authority:</b> {t.authority} &nbsp;|&nbsp; <b>Lead:</b> {t.leadAgency}
                      </div>

                      {/* Expanded Tier Details */}
                      {isSelected && (
                        <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '6px', fontSize: '0.76rem' }}>
                              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '2px' }}>🚨 Tactical Deployment:</div>
                              <div style={{ color: '#cbd5e1' }}>{t.deployment}</div>
                            </div>
                            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '6px', fontSize: '0.76rem' }}>
                              <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>📡 Comms &amp; Dispatch Backbone:</div>
                              <div style={{ color: '#cbd5e1' }}>{t.comms}</div>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.76rem', marginBottom: '10px' }}>
                            <span style={{ color: '#f87171', fontWeight: 700 }}>Trigger Metric: </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{t.trigger}</span>
                          </div>

                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Mandated Standard Operating Procedures (SOPs):
                          </div>
                          <ul style={{ margin: '0 0 6px 16px', padding: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {t.actions.map((act, aIdx) => (
                              <li key={aIdx} style={{ marginBottom: '2px' }}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Flow Connector Arrow between tiers */}
                    {idx < tiers.length - 1 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0' }}>
                        │ ▼ Escalation / De-escalation Chain
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Golden-Hour Action Protocol Timeline */}
          {ics?.golden_hour_timeline && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚡</span>
                <span>GOLDEN-HOUR OPERATIONAL COUNTDOWN TIMELINE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {ics.golden_hour_timeline.map((item: any, iIdx: number) => (
                  <div key={iIdx} style={{ background: '#090d16', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.76rem' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 800, marginBottom: '2px' }}>{item.time}</div>
                    <div style={{ color: '#cbd5e1', lineHeight: 1.35 }}>{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dual Satellite Verification Footer */}
          <div style={{
            marginTop: '14px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              🛰️ <b>Satellite Verification:</b> ISRO Bhuvan CartoDEM 30m + ESA Copernicus GLO-30 (EGM2008 Datum)
            </div>
            <div>
              NDMA India Crisis Management Standard • DMA Section 30 / 35
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
