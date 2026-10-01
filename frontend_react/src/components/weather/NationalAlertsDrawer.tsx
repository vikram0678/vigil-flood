import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const NationalAlertsDrawer: React.FC = () => {
  const { switchBasin, selectVillage, hazardFilter, setHazardFilter } = useFlood();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [hillyCities, setHillyCities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'weather'>('alerts');

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const query = hazardFilter !== 'ALL' ? `?category=${encodeURIComponent(hazardFilter)}` : '';
        const [alertsRes, weatherRes] = await Promise.all([
          fetch(`/api/weather/national-alerts-feed${query}`),
          fetch('/api/weather/hilly-cities-weather')
        ]);
        if (alertsRes.ok) {
          const aData = await alertsRes.json();
          setAlertsData(aData);
        }
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          setHillyCities(wData.cities || []);
        }
      } catch (err) {
        console.error('Failed to load national alerts feed:', err);
      }
    };

    fetchFeeds();
    const interval = setInterval(fetchFeeds, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [hazardFilter]);

  const handleAlertClick = (item: any) => {
    if (item.village_id) {
      selectVillage(item.village_id);
      setIsOpen(false);
    } else {
      const st = (item.state || '').toLowerCase();
      if (st.includes('himachal')) switchBasin('BASIN-HP-BEAS');
      else if (st.includes('uttarakhand')) switchBasin('BASIN-UK-ALAK');
      else if (st.includes('sikkim')) switchBasin('BASIN-SK-TEESTA');
      else if (st.includes('kerala')) switchBasin('BASIN-KL-WAYANAD');
      else if ((window as any).leafletMap && item.coordinates) {
        (window as any).leafletMap.flyTo(item.coordinates, 13.5, { duration: 1.0 });
      }
    }
  };

  return (
    <div className={`national-alerts-drawer ${isOpen ? 'open' : 'closed'}`} id="tour-sachet-drawer">
      {!isOpen ? (
        /* Sleek Floating Pill Trigger when Closed */
        <button 
          className="drawer-toggle-tab-closed"
          onClick={() => setIsOpen(true)}
          title="Expand National Disaster Alert Drawer"
          aria-label="Open National Alerts Feed"
        >
          <span className="drawer-tab-arrow">◀</span>
          <span className="drawer-tab-label">⚡ NATIONAL ALERTS</span>
          {alertsData && (
            <span className="alert-count-pill">{alertsData.active_alert_count}</span>
          )}
        </button>
      ) : (
        /* Clean Unified Drawer with Internal Header and Close Button */
        <div className="drawer-content">
          {/* Main Header with Title & Internal Close Button */}
          <div className="drawer-main-header">
            <div className="drawer-main-title">
              <span className="drawer-icon">⚡</span>
              <span>NATIONAL ALERTS</span>
              {alertsData && (
                <span className="alert-count-pill">{alertsData.active_alert_count}</span>
              )}
            </div>
            <button 
              className="drawer-internal-close-btn"
              onClick={() => setIsOpen(false)}
              title="Collapse Alerts Feed"
              aria-label="Close National Alerts"
            >
              &times;
            </button>
          </div>

          {/* Sub-header Tabs */}
          <div className="drawer-tabs">
            <button 
              className={`drawer-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              🚨 ALERT LIST ({alertsData?.active_alert_count || 0})
            </button>
            <button 
              className={`drawer-tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
            >
              🌤️ HILL WEATHER
            </button>
          </div>

          {activeTab === 'alerts' && (
            <div className="drawer-scroll-body">
              {/* Hazard Filter Dropdown */}
              <div className="drawer-filter-row" style={{ padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                <select 
                  value={hazardFilter} 
                  onChange={(e) => setHazardFilter(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Hazards (Pan-India)</option>
                  <option value="LANDSLIDE">Landslides (Debris Flow)</option>
                  <option value="FLASH_FLOOD">Flash Floods (Cloudburst)</option>
                  <option value="MULTI_HAZARD">Multi-Hazard (GLOF)</option>
                </select>
              </div>

              {/* Color-Coded National Alert List (Critical List First) */}
              <div className="alerts-list-header">
                <span>ACTIVE CAP DISASTER WARNINGS</span>
                <button 
                  className="table-view-link"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-state-alerts-table-modal'))}
                  title="Open Full State Table View"
                >
                  📊 Table View
                </button>
              </div>

              <div className="alerts-feed-stack">
                {(alertsData?.alerts || []).map((alert: any, idx: number) => (
                  <div 
                    key={alert.id || idx}
                    className="alert-banner-card"
                    style={{ borderLeft: `4px solid ${alert.color}` }}
                    onClick={() => handleAlertClick(alert)}
                    title={`Click to inspect ${alert.location_name} on map`}
                  >
                    <div className="alert-banner-top">
                      <div className="alert-event-name" style={{ color: alert.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{alert.icon}</span> 
                        <span style={{ fontWeight: 700 }}>{alert.event_type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {alert.risk_percentage !== undefined && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: alert.color }}>
                            {alert.risk_percentage}%
                          </span>
                        )}
                        <span className="alert-severity-badge" style={{ background: `${alert.color}25`, color: alert.color, border: `1px solid ${alert.color}60` }}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    <div className="alert-district-text">
                      <strong>{alert.location_name}</strong>{alert.district ? ` (${alert.district})` : ''}, {alert.state}
                    </div>
                    <div className="alert-desc-text" style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '4px 0', lineHeight: 1.35 }}>
                      {alert.action_directive || alert.description}
                    </div>
                    
                    <div className="alert-bottom-metrics" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', color: '#94a3b8', fontSize: '0.72rem' }}>
                        <span>☔ {alert.rainfall_mmh ?? alert.rainfall_mm_h ?? '--'} mm/h</span>
                        {alert.lead_time_display && <span>⏱️ {alert.lead_time_display}</span>}
                      </div>
                      <span className="alert-action-link" style={{ color: alert.color, fontWeight: 700, fontSize: '0.74rem' }}>Inspect Village ➔</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Earthquakes & GLOF Triggers (Moved Below Critical List) */}
              <div className="seismic-section">
                <div className="section-title">RECENT MOUNTAIN EVENTS</div>
                <div className="seismic-grid">
                  {(alertsData?.recent_earthquakes || []).map((eq: any, idx: number) => (
                    <div key={idx} className="seismic-card">
                      <div className="seismic-mag" style={{ color: eq.color }}>{eq.magnitude}</div>
                      <div className="seismic-loc">📍 {eq.location}</div>
                      <div className="seismic-time">{eq.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="drawer-scroll-body">
              <div className="section-title">CURRENT WEATHER ACROSS HILLY REGIONS</div>
              <div className="hilly-weather-stack">
                {hillyCities.map((c, idx) => (
                  <div key={idx} className="hill-city-card">
                    <div className="city-header">
                      <div className="city-name">{c.city}</div>
                      <div className="city-icon">{c.icon}</div>
                    </div>
                    <div className="city-temp">{c.temp}</div>
                    <div className="city-condition">{c.condition}</div>
                    <div className="city-meta">
                      <span>💧 Humidity: {c.humidity}</span>
                      <span>💨 Wind: {c.wind}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
