import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';

export const HydrographModal: React.FC = () => {
  const { isHydrographOpen, setHydrographOpen, hydrographVillageId, villages, selectedVillageId, selectVillage } = useFlood();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeVillageId, setActiveVillageId] = useState<string>(selectedVillageId || "VIL-01");
  const [hydroData, setHydroData] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  
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
      setActiveVillageId(hydrographVillageId || selectedVillageId || "VIL-01");
      setIsOpen(true);
    }
  }, [isHydrographOpen, hydrographVillageId, selectedVillageId]);

  // Fetch real-time hydrograph API data
  useEffect(() => {
    if (!isOpen) return;
    const fetchHydro = async () => {
      try {
        const res = await fetch(`/api/hydrograph/${activeVillageId}`);
        const data = await res.json();
        setHydroData(data);
      } catch (err) {
        console.error("Hydrograph fetch error:", err);
      }
    };
    fetchHydro();
  }, [isOpen, activeVillageId]);

  // Draw High-Precision CWC Dual-Axis Hydrograph
  const drawChart = useCallback(() => {
    if (!isOpen || !canvasRef.current || !hydroData?.hydrograph_points) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = 240;

    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 25, right: 55, bottom: 35, left: 48 };

    ctx.clearRect(0, 0, w, h);

    const pts = hydroData.hydrograph_points;
    const maxStage = Math.max(5.5, ...pts.map((p: any) => p.confidence_upper || p.stage_m));
    const maxDischarge = Math.max(600, ...pts.map((p: any) => p.discharge_m3s));

    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const getX = (idx: number) => pad.left + (idx / (pts.length - 1)) * plotW;
    const getYStage = (val: number) => h - pad.bottom - (val / maxStage) * plotH;
    const getYDischarge = (val: number) => h - pad.bottom - (val / maxDischarge) * plotH;

    // Background Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let s = 1.0; s <= maxStage; s += 1.0) {
      const y = getYStage(s);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Left axis label (Stage m)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${s.toFixed(1)}m`, pad.left - 6, y + 3);
    }

    // Right axis label (Discharge m3/s)
    for (let q = 100; q <= maxDischarge; q += 150) {
      const y = getYDischarge(q);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${q} m³/s`, w - pad.right + 6, y + 3);
    }

    // Danger Threshold Line (3.8m)
    const dangerY = getYStage(hydroData.danger_threshold_m || 3.8);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, dangerY);
    ctx.lineTo(w - pad.right, dangerY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText(`DANGER (${hydroData.danger_threshold_m}m)`, w - pad.right - 10, dangerY - 5);

    // Warning Threshold Line (3.0m)
    const warningY = getYStage(hydroData.warning_threshold_m || 3.0);
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, warningY);
    ctx.lineTo(w - pad.right, warningY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find NOW Index
    const nowIdx = pts.findIndex((p: any) => p.hour_offset === 0);

    // Confidence Interval Shading for Forecast
    if (nowIdx !== -1 && nowIdx < pts.length - 1) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      ctx.moveTo(getX(nowIdx), getYStage(pts[nowIdx].stage_m));
      for (let i = nowIdx; i < pts.length; i++) {
        ctx.lineTo(getX(i), getYStage(pts[i].confidence_upper));
      }
      for (let i = pts.length - 1; i >= nowIdx; i--) {
        ctx.lineTo(getX(i), getYStage(pts[i].confidence_lower));
      }
      ctx.closePath();
      ctx.fill();
    }

    // 1. Plot Historical 12h Observed Curve
    if (nowIdx !== -1) {
      // Area Fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getYStage(pts[0].stage_m));
      for (let i = 1; i <= nowIdx; i++) {
        ctx.lineTo(getX(i), getYStage(pts[i].stage_m));
      }
      ctx.lineTo(getX(nowIdx), h - pad.bottom);
      ctx.lineTo(getX(0), h - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(getX(0), getYStage(pts[0].stage_m));
      for (let i = 1; i <= nowIdx; i++) {
        ctx.lineTo(getX(i), getYStage(pts[i].stage_m));
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 2. Plot Forecast 6h Peak Curve
    if (nowIdx !== -1 && nowIdx < pts.length - 1) {
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.moveTo(getX(nowIdx), getYStage(pts[nowIdx].stage_m));
      for (let i = nowIdx + 1; i < pts.length; i++) {
        ctx.lineTo(getX(i), getYStage(pts[i].stage_m));
      }
      ctx.strokeStyle = hydroData.is_danger_breached ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Discharge Secondary Line (Amber Dotted)
    ctx.beginPath();
    ctx.setLineDash([2, 3]);
    ctx.moveTo(getX(0), getYDischarge(pts[0].discharge_m3s));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(getX(i), getYDischarge(pts[i].discharge_m3s));
    }
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical NOW Marker Line
    if (nowIdx !== -1) {
      const nowX = getX(nowIdx);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(nowX, pad.top);
      ctx.lineTo(nowX, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(nowX, getYStage(pts[nowIdx].stage_m), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // X-Axis Hour Labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Outfit, sans-serif';
    pts.forEach((p: any, idx: number) => {
      if (idx % 2 === 0 || p.hour_offset === 0) {
        ctx.fillText(p.label, getX(idx), h - pad.bottom + 16);
      }
    });

    // Hover Crosshair
    if (hoverPos && hoveredPoint) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverPos.x, pad.top);
      ctx.lineTo(hoverPos.x, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hoverPos.x, getYStage(hoveredPoint.stage_m), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [isOpen, hydroData, hoverPos, hoveredPoint]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Handle Mouse Hover over Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !hydroData?.hydrograph_points) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pad = { top: 25, right: 55, bottom: 35, left: 48 };
    const plotW = canvas.width - pad.left - pad.right;
    const pts = hydroData.hydrograph_points;

    if (mouseX < pad.left || mouseX > canvas.width - pad.right) {
      setHoveredPoint(null);
      setHoverPos(null);
      return;
    }

    const ratio = (mouseX - pad.left) / plotW;
    const ptIdx = Math.round(ratio * (pts.length - 1));
    const closest = pts[ptIdx];

    if (closest) {
      const getX = pad.left + (ptIdx / (pts.length - 1)) * plotW;
      setHoveredPoint(closest);
      setHoverPos({ x: getX, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  // Export CSV Data
  const handleExportCSV = () => {
    if (!hydroData?.hydrograph_points) return;
    const rows = [
      ["Hour_Offset", "Time_Label", "Stage_Level_m", "Discharge_m3s", "Type", "Confidence_Lower_m", "Confidence_Upper_m"],
      ...hydroData.hydrograph_points.map((p: any) => [
        p.hour_offset, p.label, p.stage_m, p.discharge_m3s, p.type, p.confidence_lower, p.confidence_upper
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hydrograph_${activeVillageId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setIsOpen(false);
    setHydrographOpen(false);
  };

  if (!isOpen) return null;

  const currentVillage = villages.find(v => v.id === activeVillageId) || villages[0];

  return (
    <div className="modal-backdrop active" onClick={handleClose}>
      <div className="modal-card hydrograph-card" onClick={(e) => e.stopPropagation()} style={{ width: '850px', maxWidth: '95vw' }}>
        <div className="modal-header">
          <div className="modal-title">
            <span>📈 Real-Time River Gauge Hydrograph &amp; Peak Wave Routing</span>
            <span className="modal-tag">CWC Kinematic Model (Q = C·I·A)</span>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body-content">
          {/* Village Selector Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {villages.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVillageId(v.id);
                    selectVillage(v.id);
                  }}
                  style={{
                    background: activeVillageId === v.id ? 'rgba(56, 189, 248, 0.25)' : '#0f172a',
                    border: activeVillageId === v.id ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                    color: activeVillageId === v.id ? '#38bdf8' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📍 {v.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              style={{
                background: '#1e293b',
                border: '1px solid var(--border-color)',
                color: '#cbd5e1',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📥 Export CSV Hydro-Data
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="hydrograph-metrics-grid">
            <div className="hydro-metric-card">
              <div className="hydro-metric-label">CURRENT STAGE (t=0)</div>
              <div className="hydro-metric-val" style={{ color: hydroData?.is_danger_breached ? '#ef4444' : '#38bdf8' }}>
                {hydroData?.current_stage_m?.toFixed(2) || '1.20'} m
              </div>
              <div className="hydro-metric-sub">
                {hydroData?.is_danger_breached ? '⚠️ CRITICAL INUNDATION' : '● STABLE BASEFLOW'}
              </div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">EST. PEAK DISCHARGE</div>
              <div className="hydro-metric-val" style={{ color: '#f59e0b' }}>
                {hydroData?.peak_discharge_m3s || '185'} m³/s
              </div>
              <div className="hydro-metric-sub">Runoff Coeff C: {hydroData?.runoff_coefficient_c || '0.52'}</div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">AI CREST WINDOW</div>
              <div className="hydro-metric-val" style={{ color: hydroData?.is_danger_breached ? '#ef4444' : '#34d399' }}>
                +{hydroData?.time_to_peak_hours || '2.0'}h Peak
              </div>
              <div className="hydro-metric-sub">Proj. Crest: {hydroData?.peak_projected_stage_m?.toFixed(2) || '2.80'}m</div>
            </div>

            <div className="hydro-metric-card">
              <div className="hydro-metric-label">DANGER BENCHMARK</div>
              <div className="hydro-metric-val" style={{ color: '#ef4444' }}>
                {hydroData?.danger_threshold_m?.toFixed(2) || '3.80'} m
              </div>
              <div className="hydro-metric-sub">Mandi DDMA Threshold</div>
            </div>
          </div>

          {/* Interactive Canvas with Tooltip */}
          <div className="hydrograph-chart-container" style={{ position: 'relative', marginTop: '12px' }}>
            <div className="hydrograph-chart-header">
              <span>WATER STAGE (m) [Left] &amp; DISCHARGE (m³/s) [Right] vs TIME (-12h to +6h)</span>
              <div className="hydro-legend">
                <span className="legend-box hist"></span> Observed &nbsp;&nbsp;
                <span className="legend-box fcst"></span> AI Peak Forecast &nbsp;&nbsp;
                <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>··· Q (m³/s)</span>
              </div>
            </div>

            <canvas 
              ref={canvasRef} 
              id="hydrograph-canvas"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'crosshair' }}
            />

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && hoverPos && (
              <div style={{
                position: 'absolute',
                left: Math.min(hoverPos.x + 10, canvasRef.current ? canvasRef.current.width - 160 : 300),
                top: Math.max(10, hoverPos.y - 65),
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #38bdf8',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                color: '#ffffff',
                pointerEvents: 'none',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8)',
                zIndex: 10
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '2px' }}>
                  {hoveredPoint.label === 'NOW' ? '⚡ CURRENT TIME (t=0)' : `Time: ${hoveredPoint.label}`}
                </div>
                <div>• Stage: <b>{hoveredPoint.stage_m} m</b></div>
                <div>• Discharge: <b>{hoveredPoint.discharge_m3s} m³/s</b></div>
                {hoveredPoint.type === 'FORECAST' && (
                  <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                    Range: {hoveredPoint.confidence_lower}m – {hoveredPoint.confidence_upper}m
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

