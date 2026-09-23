import React, { useRef } from 'react';
import { useFlood } from '../../context/FloodContext';

export const WhatIfSandbox: React.FC = () => {
  const { 
    simulation, 
    setSimulationValue, 
    applyScenario, 
    selectedVillageId, 
    selectVillage,
    selectedVillageData,
    toggleWaterSensor
  } = useFlood();

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
    { id: 'BASELINE_NORMAL', name: '🟢 Normal Baseline' },
    { id: 'HEAVY_MONSOON', name: '🟡 Heavy Monsoon' },
    { id: 'CLOUDBURST_CRITICAL', name: '🔴 Cloudburst Emergency' },
    { id: 'SENSOR_FAILURE_DEMO', name: '🛡️ Test Fallback Model' }
  ];

  const isWaterSensorOffline = selectedVillageData?.sensor_health?.sensors?.find(
    s => (s.sensor_type || '').toLowerCase().includes("water")
  )?.status === "OFFLINE";

  return (
    <div className="sandbox-card" id="tour-sandbox-card">
      <div className="sandbox-header">
        <div className="sandbox-title">⚡ Interactive "What-If" Simulation Sandbox</div>
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
            <span>🌧️ Rainfall Intensity</span>
            <span className="slider-val">{simulation.rain} mm/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="160"
            step="2"
            value={simulation.rain}
            onChange={(e) => handleSliderChange('rain', parseFloat(e.target.value))}
          />
        </div>

        {/* Soil Moisture Slider */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span>🌱 Soil Moisture Saturation</span>
            <span className="slider-val">{simulation.soil}%</span>
          </div>
          <input
            type="range"
            min="15"
            max="98"
            step="1"
            value={simulation.soil}
            onChange={(e) => handleSliderChange('soil', parseFloat(e.target.value))}
          />
        </div>

        {/* Water Level Slider */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span>🌊 River Surge Level</span>
            <span className="slider-val">{simulation.water} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={simulation.water}
            onChange={(e) => handleSliderChange('water', parseFloat(e.target.value))}
          />
        </div>

        {/* Water Sensor Outage Toggle Button & Hydrograph */}
        <div className="slider-group" style={{ justifyContent: 'center', gap: '6px' }}>
          <button
            className="preset-btn"
            style={{ 
              background: isWaterSensorOffline ? '#b91c1c' : '#334155', 
              color: '#ffffff',
              height: '100%',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 10px'
            }}
            onClick={() => toggleWaterSensor()}
          >
            {isWaterSensorOffline ? '🔌 Reconnect Water Sensor' : '🔌 Toggle Water Sensor Outage'}
          </button>
        </div>
      </div>
    </div>
  );
};
