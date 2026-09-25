import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const NationalAlertsDrawer: React.FC = () => {
  const { switchBasin } = useFlood();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [hillyCities, setHillyCities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'weather'>('alerts');

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const [alertsRes, weatherRes] = await Promise.all([
          fetch('/api/weather/national-alerts-feed'),
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
    const interval = setInterval(fetchFeeds, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleAlertClick = (item: any) => {
    // Map alert state to basin if matching
    const st = (item.state || '').toLowerCase();
    if (st.includes('himachal')) switchBasin('BASIN-HP-BEAS');
    else if (st.includes('uttarakhand')) switchBasin('BASIN-UK-ALAK');
    else if (st.includes('sikkim')) switchBasin('BASIN-SK-TEESTA');
    else if (st.includes('kerala')) switchBasin('BASIN-KL-WAYANAD');
    else if ((window as any).leafletMap && item.coordinates) {
      (window as any).leafletMap.flyTo(item.coordinates, 12, { duration: 1.5 });
    }
  };

  return (
    <div className={`national-alerts-drawer ${isOpen ? 'open' : 'closed'}`} id="tour-sachet-drawer">
      {/* Toggle Button */}
      <button 
        className="drawer-toggle-tab"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Collapse Alert Drawer" : "Expand National Disaster Alert Drawer"}
      >
        <span>{isOpen ? '▶' : '◀'}</span>
        <span className="drawer-tab-label">⚡ NATIONAL ALERTS</span>
        {alertsData && (
          <span className="alert-count-pill">{alertsData.active_alert_count}</span>
        )}
      </button>

      {isOpen && (
        <div className="drawer-content">
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
              {/* Recent Earthquakes & GLOF Triggers (NDMA SACHET Style Cards) */}
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

              {/* Color-Coded National Alert List */}
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
                {(alertsData?.alerts || []).map((alert: any) => (
                  <div 
                    key={alert.id}
                    className="alert-banner-card"
                    style={{ borderLeft: `4px solid ${alert.color}` }}
                    onClick={() => handleAlertClick(alert)}
                    title="Click to inspect this mountain gorge on map"
                  >
                    <div className="alert-banner-top">
                      <div className="alert-event-name" style={{ color: alert.color }}>
                        <span>{alert.icon}</span> <span>{alert.event_type.replace('_', ' ')}</span>
                      </div>
                      <span className="alert-severity-badge" style={{ background: `${alert.color}25`, color: alert.color, border: `1px solid ${alert.color}60` }}>
                        {alert.severity}
                      </span>
                    </div>

                    <div className="alert-district-text">
                      <strong>{alert.district}</strong>, {alert.state}
                    </div>

                    <div className="alert-headline-text">
                      {alert.headline}
                    </div>

                    <div className="alert-footer-row">
                      <span>🌧️ {alert.rainfall_mmh} mm/h</span>
                      <span className="action-prompt">Inspect Basin ➔</span>
                    </div>
                  </div>
                ))}
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
