import React, { useEffect, useRef, useState } from 'react';
import { useFlood } from '../../context/FloodContext';

export const HydrographModal: React.FC = () => {
  const { isHydrographOpen, setHydrographOpen, hydrographVillageId, villages } = useFlood();
  const [isOpen, setIsOpen] = useState(false);
  const [activeVillageId, setActiveVillageId] = useState<string>("VIL-01");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e.detail?.villageId) {
        setActiveVillageId(e.detail.villageId);
        setIsOpen(true);
      }
    };
    window.addEventListener('open-hydrograph-modal', handleCustomOpen);
    return () => window.removeEventListener('open-hydrograph-modal', handleCustomOpen);
  }, []);

  useEffect(() => {
    if (isHydrographOpen) {
      if (hydrographVillageId) setActiveVillageId(hydrographVillageId);
      setIsOpen(true);
    }
  }, [isHydrographOpen, hydrographVillageId]);

  const village = villages.find(v => v.id === activeVillageId) || villages[0];
  const isCritical = village?.risk_level === 'CRITICAL' || village?.risk_level === 'EXTREME';
  const stage = isCritical ? 3.8 : 1.4;
  const discharge = isCritical ? 580 : 120;
  const crestInHours = isCritical ? 1.5 : 4.0;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 200;

    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = padding.top; y <= h - padding.bottom; y += 35) {
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Danger Threshold Red Dashed Line
    const dangerY = padding.top + (h - padding.top - padding.bottom) * 0.35;
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding.left, dangerY);
    ctx.lineTo(w - padding.right, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillText('DANGER THRESHOLD (3.0m)', w - padding.right - 140, dangerY - 6);

    // Historical 24h Observed Curve
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;
    const nowX = padding.left + plotW * 0.65;

    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom - plotH * 0.2);
    ctx.bezierCurveTo(
      padding.left + plotW * 0.2, h - padding.bottom - plotH * 0.25,
      padding.left + plotW * 0.4, h - padding.bottom - (isCritical ? plotH * 0.55 : plotH * 0.3),
      nowX, h - padding.bottom - (isCritical ? plotH * 0.75 : plotH * 0.35)
    );
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // AI Forecast 3h Curve (Dashed Amber)
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(nowX, h - padding.bottom - (isCritical ? plotH * 0.75 : plotH * 0.35));
    ctx.bezierCurveTo(
      nowX + plotW * 0.15, h - padding.bottom - (isCritical ? plotH * 0.95 : plotH * 0.4),
      nowX + plotW * 0.25, h - padding.bottom - (isCritical ? plotH * 0.85 : plotH * 0.3),
      w - padding.right, h - padding.bottom - (isCritical ? plotH * 0.65 : plotH * 0.25)
    );
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Current Time Marker Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(nowX, padding.top);
    ctx.lineTo(nowX, h - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('NOW', nowX - 10, h - padding.bottom + 16);
  }, [isOpen, isCritical]);

  const handleClose = () => {
    setIsOpen(false);
    setHydrographOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={handleClose}>
      <div className="modal-card hydrograph-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>📈 Real-Time River Gauge Hydrograph & Forecast Peak</span>
            <span className="modal-tag">Google Flood Hub Model</span>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body-content">
          <div style={{ marginBottom: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Station: <b>Beas River Basin — {village?.name || 'Pandoh'}</b> (Gauge Node: BEAS-HP-04)
          </div>

          <div className="hydrograph-metrics-grid">
            <div className="hydro-metric-card">
              <div className="hydro-metric-label">CURRENT STAGE</div>
              <div className="hydro-metric-val" style={{ color: isCritical ? '#ef4444' : '#38bdf8' }}>
                {stage} m
              </div>
              <div className="hydro-metric-sub">{isCritical ? 'CRITICAL SURGE' : 'NORMAL FLOW'}</div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">EST. DISCHARGE</div>
              <div className="hydro-metric-val" style={{ color: '#f59e0b' }}>
                {discharge} m³/s
              </div>
              <div className="hydro-metric-sub">Himalayan Runoff</div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">AI FORECAST PEAK</div>
              <div className="hydro-metric-val" style={{ color: isCritical ? '#ef4444' : '#34d399' }}>
                +{crestInHours}h
              </div>
              <div className="hydro-metric-sub">Peak Crest Window</div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">WARNING THRESHOLD</div>
              <div className="hydro-metric-val" style={{ color: '#ef4444' }}>
                3.00 m
              </div>
              <div className="hydro-metric-sub">H.P. SDMA Benchmark</div>
            </div>
          </div>

          <div className="hydrograph-chart-container">
            <div className="hydrograph-chart-header">
              <span>WATER LEVEL (m) vs TIME (24h Observed + 3h Forecast)</span>
              <div className="hydro-legend">
                <span className="legend-box hist"></span> Observed &nbsp;&nbsp;
                <span className="legend-box fcst"></span> AI Peak Forecast
              </div>
            </div>
            <canvas ref={canvasRef} id="hydrograph-canvas" />
          </div>
        </div>
      </div>
    </div>
  );
};
