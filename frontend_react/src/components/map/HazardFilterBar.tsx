import React from 'react';
import { useFlood } from '../../context/FloodContext';
import { HazardFilterType } from '../../types';

interface HazardFilterOption {
  id: HazardFilterType;
  label: string;
  icon: string;
  badgeText: string;
  description: string;
  color: string;
}

export const HazardFilterBar: React.FC = () => {
  const { hazardFilter, setHazardFilter, isTelemetryCollapsed } = useFlood();
  const [alertCount, setAlertCount] = React.useState<number>(26);

  React.useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await fetch('/api/weather/national-alerts-feed');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.active_alert_count === 'number') {
            setAlertCount(data.active_alert_count);
          }
        }
      } catch (err) {}
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const options: HazardFilterOption[] = [
    {
      id: 'ALL',
      label: 'All Hazards',
      icon: '🌟',
      badgeText: 'Pan-India',
      description: 'Entire 70+ vulnerable mountain districts grid across India',
      color: '#38bdf8'
    },
    {
      id: 'LANDSLIDE',
      label: 'Landslides',
      icon: '⚠️',
      badgeText: 'Debris Flow',
      description: 'Slope failures & subsidence (Joshimath, Wayanad, Malin, Agumbe, Ooty, Aizawl)',
      color: '#f97316'
    },
    {
      id: 'FLASH_FLOOD',
      label: 'Flash Floods',
      icon: '🌊',
      badgeText: 'Cloudburst',
      description: 'Violent river surges (Kedarnath, Beas Valley, Jhelum, Pamba)',
      color: '#0284c7'
    },
    {
      id: 'MULTI_HAZARD',
      label: 'Multi-Hazard',
      icon: '⚡',
      badgeText: 'GLOF + Toe Slide',
      description: 'Simultaneous flood surge + slope failure (Chungthang Teesta, Sonamarg, Kinnaur)',
      color: '#ef4444'
    }
  ];

  return (
    <div className="hazard-filter-bar-container" id="tour-hazard-filters">
      <div className="hazard-filter-pills">
        {/* National Alerts Pill: First chip on mobile (Google Maps Alert Chip Pattern) */}
        <button
          type="button"
          className="hazard-filter-pill alerts-chip"
          onClick={() => window.dispatchEvent(new CustomEvent('open-national-alerts-drawer'))}
          title="Open National Disaster Alerts Feed"
          style={{ '--pill-active-color': '#ef4444' } as React.CSSProperties}
        >
          <span className="pill-icon">⚡</span>
          <span className="pill-label">Alerts</span>
          <span className="pill-badge alert-badge-pill" style={{
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '1px 6px',
            fontSize: '0.62rem',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {alertCount}
          </span>
        </button>

        {options.map((opt) => {
          const isActive = hazardFilter === opt.id;
          return (
            <button
              key={opt.id}
              className={`hazard-filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setHazardFilter(opt.id)}
              title={opt.description}
              style={{
                '--pill-active-color': opt.color
              } as React.CSSProperties}
            >
              <span className="pill-icon">{opt.icon}</span>
              <span className="pill-label">{opt.label}</span>
              {isTelemetryCollapsed && <span className="pill-badge">{opt.badgeText}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
