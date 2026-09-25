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
  const { hazardFilter, setHazardFilter } = useFlood();

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
              <span className="pill-badge">{opt.badgeText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
