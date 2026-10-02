import React, { useRef, useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const WhatIfSandbox: React.FC = () => {
  const {
    simulation,
    setSimulationValue,
    applyScenario,
    selectedVillageId,
    selectVillage,
    selectedVillageData,
    toggleWaterSensor,
    setHydrographOpen,
    refreshData,
    t
  } = useFlood();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const microCanvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic Hydraulic Calculations (Rational Runoff Q = C·I·A)
  const soilFrac = simulation.soil / 100.0;
  const runoffCoeff = Math.min(0.92, 0.25 + soilFrac * 0.65);
  const catchmentAreaKm2 = 24.5;
  const peakDischargeM3s = Math.round(0.278 * runoffCoeff * Math.max(10, simulation.rain) * catchmentAreaKm2);
  const slopeDeg = selectedVillageData?.village?.slope_deg || 28.0;
  const timeToPeakHours = Math.max(0.8, Number((3.5 - (slopeDeg / 45.0) * 1.5 - soilFrac * 1.0).toFixed(1)));
  const isCrestBreached = simulation.water >= 3.0;
  const isExtremeBreached = simulation.water >= 3.8;

  // Render Live Micro-Hydrograph Canvas inside Sandbox
  useEffect(() => {
    if (isCollapsed || !microCanvasRef.current) return;
    const canvas = microCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 320;
    canvas.height = 70;
    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 8, right: 14, bottom: 16, left: 28 };

    ctx.clearRect(0, 0, w, h);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = pad.top; y <= h - pad.bottom; y += 22) {
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    // Danger Threshold Line (3.0m)
    const dangerY = pad.top + (h - pad.top - pad.bottom) * 0.32;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, dangerY);
    ctx.lineTo(w - pad.right, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f87171';
    ctx.font = '700 9.5px Outfit, sans-serif';
    ctx.fillText('3.0m DANGER', w - pad.right - 65, dangerY - 3);

    // Plot Live Hydrograph Curve
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const nowX = pad.left + plotW * 0.45;
    const maxVal = 6.0;

    const scaleY = (val: number) => h - pad.bottom - (Math.min(val, maxVal) / maxVal) * plotH;

    // 1. Observed Past Curve (-6h to NOW)
    const baseVal = Math.max(0.8, simulation.water * 0.5);
    ctx.beginPath();
    ctx.moveTo(pad.left, scaleY(baseVal));
    ctx.quadraticCurveTo(
      pad.left + plotW * 0.22, scaleY(baseVal * 1.1),
      nowX, scaleY(simulation.water)
    );
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 2. Forecast Surge Curve (NOW to +6h)
    const peakForecastStage = Math.min(5.8, simulation.water + (simulation.rain / 120.0) * 2.0 + soilFrac * 0.8);
    const peakX = nowX + plotW * (timeToPeakHours / 8.0);

    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.moveTo(nowX, scaleY(simulation.water));
    ctx.bezierCurveTo(
      nowX + (peakX - nowX) * 0.5, scaleY(peakForecastStage * 0.95),
      peakX, scaleY(peakForecastStage),
      w - pad.right, scaleY(peakForecastStage * 0.7)
    );
    ctx.strokeStyle = isExtremeBreached ? '#ef4444' : isCrestBreached ? '#f59e0b' : '#34d399';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill Gradient under curve
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, isExtremeBreached ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

    ctx.beginPath();
    ctx.moveTo(pad.left, scaleY(baseVal));
    ctx.quadraticCurveTo(pad.left + plotW * 0.22, scaleY(baseVal * 1.1), nowX, scaleY(simulation.water));
    ctx.bezierCurveTo(
      nowX + (peakX - nowX) * 0.5, scaleY(peakForecastStage * 0.95),
      peakX, scaleY(peakForecastStage),
      w - pad.right, scaleY(peakForecastStage * 0.7)
    );
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Current NOW Pulse Marker
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(nowX, scaleY(simulation.water), 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('-6h', pad.left, h - 2);
    ctx.fillText('NOW', nowX - 8, h - 2);
    ctx.fillText(`+${timeToPeakHours}h Peak`, Math.min(w - pad.right - 55, peakX - 15), h - 2);
  }, [isCollapsed, simulation, runoffCoeff, timeToPeakHours, isCrestBreached, isExtremeBreached]);

  const handleSliderChange = (key: 'rain' | 'soil' | 'water', value: number) => {
    setSimulationValue(key, value);

    const newRain = key === 'rain' ? value : simulation.rain;
    const newSoil = key === 'soil' ? value : simulation.soil;
    const newWater = key === 'water' ? value : simulation.water;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      const targetVillageId = selectedVillageId || 'VIL-01';
      try {
        await fetch("/api/simulate/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            village_id: targetVillageId,
            rain_1h: newRain,
            soil_moisture: newSoil,
            water_level_m: newWater,
            water_level_rise_rate: (newWater - 1.0) * 0.4
          })
        });
        await selectVillage(targetVillageId, true);
        await refreshData();
      } catch (err) {
        console.error("Custom simulation error:", err);
      }
    }, 120);
  };

  const handleResetToLive = async () => {
    const targetVillageId = selectedVillageId || 'VIL-01';
    try {
      await applyScenario('BASELINE_NORMAL');
      const res = await fetch(`/api/villages/${targetVillageId}`);
      if (res.ok) {
        const data = await res.json();
        const rain = data.telemetry?.rain_1h ?? 15.0;
        const soil = data.telemetry?.soil_moisture ?? 42.0;
        const water = data.telemetry?.water_level_m ?? 1.1;
        setSimulationValue('rain', rain);
        setSimulationValue('soil', soil);
        setSimulationValue('water', water);
        await fetch("/api/simulate/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            village_id: targetVillageId,
            rain_1h: rain,
            soil_moisture: soil,
            water_level_m: water,
            water_level_rise_rate: (water - 1.0) * 0.4
          })
        });
      }
      await selectVillage(targetVillageId, true);
      await refreshData();
    } catch (err) {
      console.error("Reset to live error:", err);
    }
  };

  const presets = [
    { id: 'BASELINE_NORMAL', name: t('presetBaseline') },
    { id: 'CLOUDBURST_CRITICAL', name: t('presetCloudburstCrit') },
    { id: 'HEAVY_MONSOON', name: t('presetMonsoonSat') },
    { id: 'DAM_BREACH_GLOF', name: t('presetDamGlof') }
  ];

  const currentPresetName = presets.find(p => p.id === simulation.activePreset)?.name || t('customParameters');

  const isWaterSensorOffline = selectedVillageData?.sensor_health?.sensors?.find(
    s => (s.sensor_type || '').toLowerCase().includes("water")
  )?.status === "OFFLINE";

  return (
    <div className={`sandbox-card simulation-dock ${isCollapsed ? 'collapsed' : ''} full-width-dock`} id="tour-sandbox-card">
      <div className="sandbox-header" style={{ justifyContent: 'flex-start', gap: '14px' }}>
        <button
          className="sandbox-toggle-btn icon-only"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sandbox" : "Collapse Sandbox"}
          style={{ width: '28px', height: '28px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <span className="toggle-chevron">{isCollapsed ? '▾' : '▴'}</span>
        </button>

        <div className="sandbox-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row' }}>
          <div className="sandbox-title" style={{ margin: 0, fontSize: '0.84rem' }}>{t('interactiveSimulation')}</div>
          {isCollapsed && (
            <div className="sandbox-compact-preview" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="compact-preset-badge">{currentPresetName}</span>
              <span className="compact-metric-pill">🌧️ {Number(simulation.rain).toFixed(2)} mm/h</span>
              <span className="compact-metric-pill">🌱 {Number(simulation.soil).toFixed(2)}%</span>
              <span className="compact-metric-pill">🌊 {Number(simulation.water).toFixed(2)} m</span>
              <span className="compact-metric-pill" style={{ color: isExtremeBreached ? '#ef4444' : '#38bdf8' }}>
                ⚡ Qp: {peakDischargeM3s} m³/s
              </span>
            </div>
          )}
        </div>

        <div className="sandbox-header-actions" style={{ marginLeft: 'auto' }}>
          {!isCollapsed && (
            <div className="preset-buttons">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className={`preset-btn ${simulation.activePreset === p.id ? 'active' : ''}`}
                  onClick={() => applyScenario(p.id)}
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="sandbox-sliders-grid-wrapper" style={{ marginTop: '4px' }}>
          {/* Hydraulic Telemetry Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 10px',
            marginBottom: '6px',
            fontSize: '0.72rem',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <span style={{ color: '#f1f5f9' }}>{t('cwcHydrology')}</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{t('runoffCoeff')}{runoffCoeff.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: '#f1f5f9' }}>{t('peakDischarge')}</span>
              <span style={{ fontWeight: 800, color: isExtremeBreached ? '#ef4444' : '#f59e0b' }}>
                {peakDischargeM3s} m³/s
              </span>
            </div>
            <div>
              <span style={{ color: '#f1f5f9' }}>{t('crestWindow')}</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>+{timeToPeakHours}h Peak</span>
            </div>
            <button
              onClick={() => setHydrographOpen(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t('fullCwcHydrograph')}
            </button>
          </div>

          <div className="sandbox-interactive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            {/* Left: Sliders Grid */}
            <div className="sandbox-sliders-grid" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Quick Reset to Live Telemetry Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('adjustTelemetry')}
                </span>
                <button
                  type="button"
                  onClick={handleResetToLive}
                  title="Reset sliders back to live real-time weather & sensor readings"
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>↺</span> {t('resetToLive')}
                </button>
              </div>

              {/* Rainfall Slider */}
              <div className="slider-group">
                <div className="slider-label-row" style={{ marginBottom: '1px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#f1f5f9' }}>🌧️ Rainfall Intensity</span>
                  <span className="slider-val" style={{ fontSize: '0.74rem' }}>{Number(simulation.rain).toFixed(2)} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="2"
                  value={simulation.rain}
                  onChange={(e) => handleSliderChange('rain', parseFloat(e.target.value))}
                  style={{ margin: 0, height: '14px' }}
                />
              </div>

              {/* Soil Moisture Slider */}
              <div className="slider-group">
                <div className="slider-label-row" style={{ marginBottom: '1px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#f1f5f9' }}>🌱 Soil Moisture Saturation</span>
                  <span className="slider-val" style={{ fontSize: '0.74rem' }}>{Number(simulation.soil).toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="98"
                  step="1"
                  value={simulation.soil}
                  onChange={(e) => handleSliderChange('soil', parseFloat(e.target.value))}
                  style={{ margin: 0, height: '14px' }}
                />
              </div>

              {/* Water Level Slider */}
              <div className="slider-group">
                <div className="slider-label-row" style={{ marginBottom: '1px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#f1f5f9' }}>🌊 River Surge Level</span>
                  <span className="slider-val" style={{ fontSize: '0.74rem', color: isExtremeBreached ? '#ef4444' : isCrestBreached ? '#f59e0b' : '#38bdf8' }}>
                    {Number(simulation.water).toFixed(2)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={simulation.water}
                  onChange={(e) => handleSliderChange('water', parseFloat(e.target.value))}
                  style={{ margin: 0, height: '14px' }}
                />
              </div>

              {/* Water Sensor Outage Toggle Button */}
              <button
                className="preset-btn"
                style={{
                  background: isWaterSensorOffline ? '#b91c1c' : '#1e293b',
                  color: isWaterSensorOffline ? '#fca5a5' : '#94a3b8',
                  border: isWaterSensorOffline ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '4px 8px',
                  width: '100%',
                  marginTop: '1px'
                }}
                onClick={() => toggleWaterSensor()}
              >
                {isWaterSensorOffline ? '🔌 Reconnect Water Sensor Node' : '🔌 Simulate Sensor Outage (Test Fallback)'}
              </button>
            </div>

            {/* Right: Live Dynamic Hydrograph Curve */}
            <div style={{
              background: '#070a12',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8' }}>
                  📈 LIVE DISCHARGE SURGE HYDROGRAPH
                </span>
                <span style={{ fontSize: '0.66rem', color: isExtremeBreached ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                  {isExtremeBreached ? '⚠️ CRITICAL SURGE' : isCrestBreached ? '🟠 WARNING ACTIVE' : '● STABLE RUNOFF'}
                </span>
              </div>

              <canvas ref={microCanvasRef} style={{ width: '100%', height: '70px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', marginTop: '2px', fontWeight: 600 }}>
                <span style={{ color: '#e5f7ffff' }}>Blue: Observed Stage</span>
                <span style={{ color: '#fffbf3ff' }}>Dashed: AI Kinematic Peak Forecast</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

