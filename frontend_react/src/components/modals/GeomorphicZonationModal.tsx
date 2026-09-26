import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export interface GeotechnicalProfile {
  dominant_geology: string;
  rock_formation: string;
  soil_type: string;
  effective_cohesion_kpa: number;
  friction_angle_deg: number;
  saturated_unit_weight_kn_m3: number;
  soil_depth_m: number;
  baseline_fos: number;
  lhz_hazard_class: string;
  permeability_cm_s: number;
  critical_slope_deg: number;
  primary_failure_mechanism: string;
}

export interface DistrictZonation {
  id: string;
  district_name: string;
  state: string;
  sector_id: string;
  sector_name: string;
  center_coords: [number, number];
  elevation_range_m: [number, number];
  mean_annual_rainfall_mm: number;
  historical_slide_count: number;
  isro_susceptibility_rank: string;
  flash_flood_vulnerability: string;
  primary_river_basin: string;
  geotech: GeotechnicalProfile;
  ndma_mitigation_directive: string;
  active_pilot_basin_id?: string | null;
}

export interface SectorSummary {
  sector_id: string;
  name: string;
  code: string;
  description: string;
  total_districts: number;
  very_high_risk_districts: number;
  high_risk_districts: number;
  moderate_risk_districts: number;
  total_historical_slide_events: number;
  mean_annual_rainfall_mm: number;
  states: string[];
  dominant_hazards: string[];
}

export const GeomorphicZonationModal: React.FC = () => {
  const { switchBasin, isGeomorphicOpen, setGeomorphicOpen } = useFlood();
  const [activeSector, setActiveSector] = useState<string>('ALL');
  const [susceptibilityFilter, setSusceptibilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sectors, setSectors] = useState<SectorSummary[]>([]);
  const [districts, setDistricts] = useState<DistrictZonation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fosResult, setFosResult] = useState<any | null>(null);

  useEffect(() => {
    const handleOpen = () => setGeomorphicOpen(true);
    window.addEventListener('open-geomorphic-zonation-modal', handleOpen);
    return () => window.removeEventListener('open-geomorphic-zonation-modal', handleOpen);
  }, [setGeomorphicOpen]);

  useEffect(() => {
    if (!isGeomorphicOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [secRes, distRes] = await Promise.all([
          fetch('/api/geomorphic/sectors').then(r => r.json()),
          fetch('/api/geomorphic/districts').then(r => r.json())
        ]);
        setSectors(secRes.sectors || []);
        setDistricts(distRes.districts || []);
      } catch (err) {
        console.error('Failed to load geomorphic data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isGeomorphicOpen]);

  if (!isGeomorphicOpen) return null;

  // Filter districts
  const filteredDistricts = districts.filter(d => {
    if (activeSector !== 'ALL' && d.sector_id !== activeSector) return false;
    if (susceptibilityFilter !== 'ALL' && d.isro_susceptibility_rank !== susceptibilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.district_name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.primary_river_basin.toLowerCase().includes(q) ||
        d.geotech.dominant_geology.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInspectOnMap = (d: DistrictZonation) => {
    setGeomorphicOpen(false);
    if (d.active_pilot_basin_id) {
      switchBasin(d.active_pilot_basin_id);
    } else if ((window as any).leafletMap && d.center_coords) {
      (window as any).leafletMap.flyTo(d.center_coords, 11.5, { duration: 1.5 });
    }
  };

  const handleRunDynamicFoS = async (districtId: string, distName: string) => {
    try {
      const res = await fetch(`/api/geomorphic/districts/${districtId}/dynamic-fos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_rain_1h: 75.0,
          current_soil_moisture_pct: 82.0
        })
      }).then(r => r.json());

      setFosResult(res);
    } catch (err) {
      console.error('Error computing dynamic FoS:', err);
    }
  };

  const currentSectorData = activeSector !== 'ALL' ? sectors.find(s => s.sector_id === activeSector) : null;

  return (
    <div className="modal-backdrop" onClick={() => setGeomorphicOpen(false)} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1120,
          width: '95vw',
          maxHeight: '90vh',
          background: 'rgba(11, 19, 38, 0.98)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 16,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>🏔️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>
                ISRO Landslide Atlas & NDMA LHZ Geomorphic Zonation
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                147+ Vulnerable Mountain Districts • 3 Physiographic Sectors • Geotechnical Baseline Parameters
              </div>
            </div>
          </div>
          <button 
            onClick={() => setGeomorphicOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.6rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Sector Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <button
              onClick={() => setActiveSector('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: activeSector === 'ALL' ? '1px solid #38bdf8' : '1px solid #334155',
                background: activeSector === 'ALL' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(99, 102, 241, 0.4))' : 'rgba(15, 23, 42, 0.7)',
                color: activeSector === 'ALL' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🌐 All Sectors (147+ Districts)
            </button>
            <button
              onClick={() => setActiveSector('SEC-NW-HIM')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: activeSector === 'SEC-NW-HIM' ? '1px solid #38bdf8' : '1px solid #334155',
                background: activeSector === 'SEC-NW-HIM' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(99, 102, 241, 0.4))' : 'rgba(15, 23, 42, 0.7)',
                color: activeSector === 'SEC-NW-HIM' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🏔️ NW & Central Himalayas (SEC-NW-HIM)
            </button>
            <button
              onClick={() => setActiveSector('SEC-WG-SOU')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: activeSector === 'SEC-WG-SOU' ? '1px solid #38bdf8' : '1px solid #334155',
                background: activeSector === 'SEC-WG-SOU' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(99, 102, 241, 0.4))' : 'rgba(15, 23, 42, 0.7)',
                color: activeSector === 'SEC-WG-SOU' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🌴 Western Ghats & South (SEC-WG-SOU)
            </button>
            <button
              onClick={() => setActiveSector('SEC-NE-HIL')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: activeSector === 'SEC-NE-HIL' ? '1px solid #38bdf8' : '1px solid #334155',
                background: activeSector === 'SEC-NE-HIL' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(99, 102, 241, 0.4))' : 'rgba(15, 23, 42, 0.7)',
                color: activeSector === 'SEC-NE-HIL' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              ⛰️ North-Eastern Hills (SEC-NE-HIL)
            </button>
          </div>

          {/* Sector Aggregate Summary Banner */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            {activeSector === 'ALL' ? (
              <>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>NATIONAL COVERAGE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>147+ Mountain Districts (12.6% Landmass)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>VERY HIGH SUSCEPTIBILITY</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>
                    {districts.filter(d => d.isro_susceptibility_rank === 'VERY_HIGH').length} Districts
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>HIGH SUSCEPTIBILITY</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f97316' }}>
                    {districts.filter(d => d.isro_susceptibility_rank === 'HIGH').length} Districts
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>ISRO HISTORICAL INVENTORY</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                    {districts.reduce((a, b) => a + (b.historical_slide_count || 0), 0).toLocaleString()} Logged Events
                  </div>
                </div>
              </>
            ) : currentSectorData ? (
              <>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8', marginBottom: 2 }}>
                    {currentSectorData.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    {currentSectorData.description}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>DISTRICTS</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{currentSectorData.total_districts}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>VERY HIGH RISK</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>{currentSectorData.very_high_risk_districts}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>MEAN RAIN</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{currentSectorData.mean_annual_rainfall_mm} mm/yr</div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Search & Susceptibility Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search district, state, river basin, or rock formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 14px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                value={susceptibilityFilter}
                onChange={(e) => setSusceptibilityFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Risk Categories</option>
                <option value="VERY_HIGH">🔴 Very High Susceptibility</option>
                <option value="HIGH">🟠 High Susceptibility</option>
                <option value="MODERATE">🟡 Moderate Susceptibility</option>
              </select>

              <span style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                whiteSpace: 'nowrap'
              }}>
                {filteredDistricts.length} of {districts.length} Districts
              </span>
            </div>
          </div>

          {/* Districts Grid */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#38bdf8' }}>
              🔄 Loading ISRO Landslide Atlas & NDMA LHZ Records...
            </div>
          ) : filteredDistricts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              🔍 No mountain districts match your search criteria.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12,
              maxHeight: '52vh',
              overflowY: 'auto',
              paddingRight: 4
            }}>
              {filteredDistricts.map(d => {
                const isPilot = !!d.active_pilot_basin_id;
                const rankColor = d.isro_susceptibility_rank === 'VERY_HIGH' ? '#ef4444' : d.isro_susceptibility_rank === 'HIGH' ? '#f97316' : '#f59e0b';
                const gt = d.geotech;

                return (
                  <div
                    key={d.id}
                    style={{
                      background: isPilot ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.75)',
                      border: isPilot ? '1px solid #10b981' : '1px solid rgba(51, 65, 85, 0.7)',
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#f8fafc' }}>
                          {d.district_name}
                          {isPilot && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>
                              PILOT BASIN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          📍 {d.state} • {d.primary_river_basin}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: `${rankColor}22`,
                        color: rankColor,
                        border: `1px solid ${rankColor}66`,
                        whiteSpace: 'nowrap'
                      }}>
                        ISRO: {d.isro_susceptibility_rank.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 6,
                      background: 'rgba(7, 10, 19, 0.5)',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: '0.72rem'
                    }}>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>DOMINANT GEOLOGY</div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }} title={gt.dominant_geology}>
                          {gt.dominant_geology.length > 22 ? gt.dominant_geology.substring(0, 20) + '...' : gt.dominant_geology}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>BASELINE FACTOR OF SAFETY</div>
                        <div style={{ fontWeight: 700, color: '#38bdf8' }}>FoS: {gt.baseline_fos.toFixed(2)} (Dry)</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>CRITICAL SLOPE RANGE</div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>~{gt.critical_slope_deg}° (ϕ: {gt.friction_angle_deg}°)</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>HISTORICAL SLIDES</div>
                        <div style={{ fontWeight: 700, color: '#f59e0b' }}>{d.historical_slide_count} Logged Events</div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.70rem',
                      color: '#cbd5e1',
                      background: 'rgba(56, 189, 248, 0.06)',
                      borderLeft: '2px solid #38bdf8',
                      padding: '5px 8px',
                      borderRadius: '0 6px 6px 0',
                      lineHeight: 1.3
                    }}>
                      <b>🛡️ NDMA SOP:</b> {d.ndma_mitigation_directive}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <button
                        onClick={() => handleInspectOnMap(d)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🎯 Inspect & Center Map
                      </button>

                      <button
                        onClick={() => handleRunDynamicFoS(d.id, d.district_name)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Live FoS Analysis
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic FoS Popup Modal if triggered */}
        {fosResult && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={() => setFosResult(null)}
          >
            <div 
              style={{
                background: '#0f172a',
                border: '1px solid #38bdf8',
                borderRadius: 12,
                padding: 24,
                maxWidth: 480,
                width: '90%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.1rem' }}>
                🔬 Geotechnical Slope Stability (FoS) Report
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                <div><b>District:</b> {fosResult.district_name} ({fosResult.state})</div>
                <div><b>Current Telemetry:</b> {fosResult.current_rain_1h} mm/h Rain | {fosResult.current_soil_moisture_pct}% Moisture</div>
                <div><b>Pore-Water Pressure (u):</b> {fosResult.pore_water_pressure_kpa} kPa</div>
                <div style={{ marginTop: 8, padding: '8px 12px', background: `${fosResult.badge_color}22`, border: `1px solid ${fosResult.badge_color}`, borderRadius: 6 }}>
                  <b>Dynamic Factor of Safety (FoS):</b> <span style={{ fontSize: '1.1rem', fontWeight: 800, color: fosResult.badge_color }}>{fosResult.dynamic_fos}</span> (Baseline: {fosResult.baseline_dry_fos})<br />
                  <b>Status:</b> <span style={{ color: fosResult.badge_color, fontWeight: 800 }}>{fosResult.alert_level} ALERT</span>
                </div>
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#94a3b8' }}>
                  <b>Directive:</b> {fosResult.action_code}<br />
                  <b>NDMA SOP:</b> {fosResult.mitigation_directive}
                </div>
              </div>
              <button
                onClick={() => setFosResult(null)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '8px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
