import React, { useRef } from 'react';
import { useFlood } from '../../context/FloodContext';

export const WhatIfSandbox: React.FC = () => {
  const { simulation, setSimulationValue, applyScenario, selectedVillageId, selectVillage } = useFlood();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = (key: 'rain' | 'soil' | 'water', value: number) => {
    setSimulationValue(key, value);

    const newRain = key === 'rain' ? value : simulation.rain;
    const newSoil = key === 'soil' ? value : simulation.soil;
    const newWater = key === 'water' ? value : simulation.water;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await fetch("/api/simulate/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            village_id: selectedVillageId,
            rain_1h: newRain,
            soil_moisture: newSoil,
            water_level_m: newWater,
            water_level_rise_rate: (newWater - 1.0) * 0.4
          })
        });
        await selectVillage(selectedVillageId);
      } catch (err) {
        console.error("Custom simulation error:", err);
      }
    }, 150);
  };

  const presets = [
    { id: 'cloudburst', name: '⚡ Cloudburst (120mm/h)' },
    { id: 'monsoon_peak', name: '🌧️ Heavy Monsoon (65mm/h)' },
    { id: 'dam_spillway', name: '🌊 Dam Spillway (3.8m)' },
    { id: 'baseline', name: '☀️ Clear Weather (Baseline)' }
  ];

  return (
    <div className="sandbox-card">
      <div className="sandbox-header">
        <div className="sandbox-title">
          <span>🧪 Interactive What-If Scenario Sandbox</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            (Live Physics + TreeSHAP Inference)
          </span>
        </div>
        <div className="preset-buttons">
          {presets.map((p) => (
            <button
              key={p.id}
              className={`preset-btn ${simulation.activePreset === p.id ? 'active' : ''}`}
              onClick={() => applyScenario(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="sandbox-sliders-grid">
        {/* Rainfall Slider */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span>Rainfall Rate:</span>
            <span className="slider-val">{simulation.rain} mm/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            step="1"
            value={simulation.rain}
            onChange={(e) => handleSliderChange('rain', parseFloat(e.target.value))}
          />
        </div>

        {/* Soil Moisture Slider */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span>Soil Saturation:</span>
            <span className="slider-val">{simulation.soil}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={simulation.soil}
            onChange={(e) => handleSliderChange('soil', parseFloat(e.target.value))}
          />
        </div>

        {/* Water Level Slider */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span>Stream Gauge:</span>
            <span className="slider-val">{simulation.water} m</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="6.0"
            step="0.1"
            value={simulation.water}
            onChange={(e) => handleSliderChange('water', parseFloat(e.target.value))}
          />
        </div>

        {/* Live Hydrograph Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'linear-gradient(135deg, #0369a1, #0284c7)',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => {
              const event = new CustomEvent('open-hydrograph-modal', { detail: { villageId: selectedVillageId } });
              window.dispatchEvent(event);
            }}
          >
            <span>📈</span>
            <span>View Hydrograph Gauge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
