import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';

export const RiverCrossSectionHUD: React.FC = () => {
  // const { simulation, selectedVillageData, selectedVillageId, villages, language } = useFlood();
  const { simulation, selectedVillageData, selectedVillageId, villages, language, theme } = useFlood();
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);

  const activeVillage = selectedVillageData?.village || villages.find(v => v.id === selectedVillageId) || villages[0];
  const waterLevel = simulation.water || 1.8;
  const slopeDeg = activeVillage?.slope_deg || 28;
  const villageName = activeVillage?.name || 'Pandoh Valley';
  const riverName = activeVillage?.district ? `${activeVillage.district} River` : 'Beas River';

  // Hydraulic parameters
  const warningLevel = 2.2;
  const dangerLevel = 3.0;
  const bridgeDeckLevel = 4.2;
  const maxScaleMeters = 5.5;

  const clearanceM = Math.max(-1.5, bridgeDeckLevel - waterLevel);
  const isBridgeSubmerged = clearanceM <= 0;
  const isDangerBreached = waterLevel >= dangerLevel;
  const isWarningBreached = waterLevel >= warningLevel;

  // Manning's velocity and discharge
  const velocityMs = Number((1.2 + Math.sqrt(waterLevel) * 1.3 * (slopeDeg / 25)).toFixed(1));
  const channelWidthM = 18 + waterLevel * 3.5;
  const dischargeQ = Math.round(channelWidthM * waterLevel * velocityMs * 0.75);

  // Theme colors
  const stageColor = isDangerBreached ? '#ef4444' : isWarningBreached ? '#f59e0b' : '#38bdf8';
  const borderColor = isDangerBreached ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.25)';

  // SVG Geometry
  const svgWidth = 420;
  const svgHeight = 200;
  const padLeft = 36;
  const padRight = 20;
  const padBottom = 24;
  const padTop = 22;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getY = (meters: number) => {
    const clamped = Math.max(0, Math.min(meters, maxScaleMeters));
    return padTop + plotHeight - (clamped / maxScaleMeters) * plotHeight;
  };

  const bedY = getY(0);
  const waterY = getY(waterLevel);
  const warnY = getY(warningLevel);
  const dangerY = getY(dangerLevel);
  const bridgeY = getY(bridgeDeckLevel);

  // Valley profile points
  const leftBankX = padLeft + 12;
  const leftBedX = padLeft + plotWidth * 0.30;
  const rightBedX = padLeft + plotWidth * 0.70;
  const rightBankX = padLeft + plotWidth - 12;

  // Water contact points on slopes
  const slopeRatio = Math.max(0, Math.min(1, (waterY - padTop) / (bedY - padTop)));
  const waterLeftX = leftBankX + slopeRatio * (leftBedX - leftBankX);
  const waterRightX = rightBankX - slopeRatio * (rightBankX - rightBedX);

  // Inject keyframes once
  const kfId = 'river-hud-keyframes';
  if (typeof document !== 'undefined' && !document.getElementById(kfId)) {
    const s = document.createElement('style');
    s.id = kfId;
    s.textContent = `
      @keyframes riverHudSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes waterShimmer { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:20} }
      @keyframes hudPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    `;
    document.head.appendChild(s);
  }

  // Metric card helper
  const MetricCard = ({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) => (
    <div style={{
      background: isLight ? '#f8fafc' : 'rgba(15,23,42,0.6)',
      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
      borderRadius: '8px',
      padding: '6px 0',
      textAlign: 'center',
      flex: 1,
      minWidth: 0
    }}>
      <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
        {label}
      </div>
      <div style={{ fontSize: '0.92rem', fontWeight: 800, color, marginTop: '1px', letterSpacing: '-0.01em' }}>
        {value}{unit && <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Trigger Button ─── */}
      {/* <button
        id="btn-toggle-bathymetry-hud"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '16px',
          zIndex: 850,
          background: isOpen
            ? `linear-gradient(135deg, ${stageColor}20, ${stageColor}10)`
            : 'rgba(13, 20, 38, 0.92)',
          backdropFilter: 'blur(16px) saturate(1.5)',
          border: `1px solid ${isOpen ? stageColor + '60' : 'rgba(255,255,255,0.1)'}`,
          color: '#e2e8f0',
          borderRadius: '10px',
          padding: '7px 14px',
          fontSize: '0.74rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: '0.02em'
        }}
        title="River Valley Cross-Section & Bridge Clearance"
      >
        <span style={{ fontSize: '0.95rem' }}>📐</span>
        <span>{language === 'hi' ? 'क्रॉस-सेक्शन' : 'Cross-Section'}</span>
        {isDangerBreached && (
          <span style={{
            background: 'rgba(239,68,68,0.2)',
            color: '#f87171',
            fontSize: '0.6rem',
            padding: '1px 6px',
            borderRadius: '6px',
            fontWeight: 800,
            border: '1px solid rgba(239,68,68,0.35)',
            animation: 'hudPulse 1.5s ease-in-out infinite'
          }}>
            HFL
          </span>
        )}
      </button> */}
      {/* ─── Trigger Button ─── */}
      <button
        id="btn-toggle-bathymetry-hud"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '16px',
          zIndex: 900,
          /* Solid, crisp background - NO transparent blur smear! */
          background: isLight
            ? (isOpen ? '#e0f2fe' : '#ffffff')
            : (isOpen ? '#0369a1' : '#0f172a'),
          border: isLight
            ? (isOpen ? '1.5px solid #0284c7' : '1px solid #cbd5e1')
            : (isOpen ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)'),
          color: isLight
            ? (isOpen ? '#0284c7' : '#0f172a')
            : '#ffffff',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '0.74rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isLight
            ? '0 4px 16px rgba(0,0,0,0.08)'
            : '0 4px 16px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
          fontFamily: "'Inter', sans-serif"
        }}
        title="River Valley Cross-Section & Bridge Clearance"
      >
        <span style={{ fontSize: '0.95rem' }}>📐</span>
        <span>{language === 'hi' ? 'क्रॉस-सेक्शन' : 'Cross-Section'}</span>
        {isDangerBreached && (
          <span style={{
            background: 'rgba(239,68,68,0.2)',
            color: '#f87171',
            fontSize: '0.6rem',
            padding: '1px 6px',
            borderRadius: '6px',
            fontWeight: 800,
            border: '1px solid rgba(239,68,68,0.35)'
          }}>
            HFL
          </span>
        )}
      </button>
      {/* ─── Main Cross-Section Panel ─── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '94px',
          left: '16px',
          zIndex: 860,
          width: '440px',
          maxWidth: 'calc(100vw - 32px)',
          background: isLight
            ? '#ffffff'
            : 'linear-gradient(170deg, #0f172a 0%, #080e1a 100%)',
          border: isLight
            ? '1px solid #cbd5e1'
            : `1px solid ${borderColor}`,
          borderRadius: '14px',
          boxShadow: isDangerBreached
            ? '0 12px 40px rgba(239,68,68,0.2), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 20px rgba(56,189,248,0.08)',
          color: isLight ? '#0f172a' : '#f1f5f9',
          overflow: 'hidden',
          animation: 'riverHudSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${stageColor}25, ${stageColor}10)`,
                border: `1px solid ${stageColor}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', flexShrink: 0
              }}>🌊</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0',
                  letterSpacing: '0.04em'
                }}>
                  {language === 'hi' ? 'नदी क्रॉस-सेक्शन' : 'RIVER CROSS-SECTION'}
                </div>
                <div style={{
                  fontSize: '0.63rem', color: '#64748b',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {villageName} • {riverName} • {slopeDeg}°
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {/* Live indicator */}
              <span style={{
                fontSize: '0.58rem', fontWeight: 700,
                padding: '2px 7px', borderRadius: '6px',
                background: isDangerBreached ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)',
                color: isDangerBreached ? '#f87171' : '#38bdf8',
                border: `1px solid ${isDangerBreached ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.2)'}`,
                animation: 'hudPulse 2s ease-in-out infinite',
                marginRight: '6px'
              }}>
                {isDangerBreached ? '⚠ CRITICAL' : '● LIVE'}
              </span>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8',
                cursor: 'pointer', padding: '4px 6px', fontSize: '0.85rem',
                borderRadius: '6px', transition: 'color 0.15s'
              }} title="Close">✕</button>
            </div>
          </div>

          {/* ── Content Body ── */}
          <div style={{ padding: '12px 14px 14px' }}>

            {/* ── Metric Strip ── */}
            <div style={{
              display: 'flex', gap: '6px', marginBottom: '10px'
            }}>
              <MetricCard label="Stage" value={waterLevel.toFixed(1)} unit="m" color={stageColor} />
              <MetricCard
                label="Bridge"
                value={isBridgeSubmerged ? '—' : `+${clearanceM.toFixed(1)}`}
                unit={isBridgeSubmerged ? undefined : 'm'}
                color={isBridgeSubmerged ? '#ef4444' : '#34d399'}
              />
              <MetricCard label="Velocity" value={`${velocityMs}`} unit=" m/s" color={isLight ? '#0f172a' : '#e2e8f0'} />
              <MetricCard label="Q" value={`${dischargeQ}`} unit=" m³/s" color={isDangerBreached ? '#f87171' : '#f59e0b'} />
            </div>

            {/* ── SVG Cross-Section ── */}
            <div style={{
              position: 'relative',
              background: isLight ? '#f1f5f9' : 'rgba(8,12,24,0.85)',
              borderRadius: '10px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="waterGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDangerBreached ? '#dc2626' : '#0ea5e9'} stopOpacity="0.75" />
                    <stop offset="100%" stopColor={isDangerBreached ? '#7f1d1d' : '#0369a1'} stopOpacity="0.92" />
                  </linearGradient>
                  <linearGradient id="terrainGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>

                {/* Terrain */}
                <polygon
                  points={`0,${padTop} ${leftBankX},${padTop} ${leftBedX},${bedY} ${rightBedX},${bedY} ${rightBankX},${padTop} ${svgWidth},${padTop} ${svgWidth},${svgHeight} 0,${svgHeight}`}
                  fill="url(#terrainGrad2)"
                  stroke="#475569"
                  strokeWidth="1"
                />

                {/* Riverbed */}
                <line x1={leftBedX} y1={bedY} x2={rightBedX} y2={bedY} stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 2" />

                {/* Grid lines */}
                <g opacity="0.3" stroke="#475569" strokeWidth="0.5" strokeDasharray="2 4">
                  {[1, 2, 3, 4, 5].map(m => (
                    <line key={m} x1={padLeft} y1={getY(m)} x2={svgWidth - padRight} y2={getY(m)} />
                  ))}
                </g>

                {/* Y-Axis labels */}
                {[0, 1, 2, 3, 4, 5].map(m => (
                  <text key={m} x={padLeft - 5} y={getY(m) + 3} fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="end"
                    fontFamily="'Inter', system-ui, sans-serif">
                    {m}m
                  </text>
                ))}

                {/* Water volume */}
                <polygon
                  points={`${waterLeftX},${waterY} ${leftBedX},${bedY} ${rightBedX},${bedY} ${waterRightX},${waterY}`}
                  fill="url(#waterGrad2)"
                  stroke={stageColor}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)' }}
                />

                {/* Animated water surface */}
                <line
                  x1={waterLeftX} y1={waterY} x2={waterRightX} y2={waterY}
                  stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6"
                  strokeDasharray="5 3"
                  style={{ animation: 'waterShimmer 1.5s linear infinite' }}
                />

                {/* Normal level 1.0m */}
                <line x1={padLeft} y1={getY(1.0)} x2={svgWidth - padRight} y2={getY(1.0)} stroke="#10b981" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={svgWidth - padRight - 3} y={getY(1.0) - 3} fill="#10b981" fontSize="7.5" fontWeight="700" textAnchor="end"
                  fontFamily="'Inter', system-ui, sans-serif">
                  Normal 1.0m
                </text>

                {/* Warning level 2.2m */}
                <line x1={padLeft} y1={warnY} x2={svgWidth - padRight} y2={warnY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
                <text x={svgWidth - padRight - 3} y={warnY - 3} fill="#f59e0b" fontSize="7.5" fontWeight="700" textAnchor="end"
                  fontFamily="'Inter', system-ui, sans-serif">
                  Warning 2.2m
                </text>

                {/* HFL Danger 3.0m */}
                <line x1={padLeft} y1={dangerY} x2={svgWidth - padRight} y2={dangerY} stroke="#ef4444" strokeWidth="1.5" />
                <text x={svgWidth - padRight - 3} y={dangerY - 3} fill="#ef4444" fontSize="8" fontWeight="800" textAnchor="end"
                  fontFamily="'Inter', system-ui, sans-serif">
                  HFL 3.0m
                </text>

                {/* Bridge deck */}
                <rect
                  x={leftBankX - 8} y={bridgeY - 5}
                  width={rightBankX - leftBankX + 16} height="6"
                  fill={isBridgeSubmerged ? '#dc2626' : '#94a3b8'}
                  stroke={isBridgeSubmerged ? '#ffffff' : '#475569'}
                  strokeWidth="1" rx="1.5"
                  style={{ transition: 'fill 0.4s ease' }}
                />
                {/* Bridge piers */}
                <rect x={leftBedX + 22} y={bridgeY + 1} width="6" height={bedY - bridgeY - 1} fill="#64748b" opacity="0.7" rx="1" />
                <rect x={rightBedX - 28} y={bridgeY + 1} width="6" height={bedY - bridgeY - 1} fill="#64748b" opacity="0.7" rx="1" />

                {/* Bridge label */}
                <text
                  x={svgWidth / 2}
                  y={bridgeY - 8}
                  fill={isBridgeSubmerged ? '#ef4444' : (isLight ? '#0f172a' : '#ffffff')}
                  fontSize="8"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="'Inter', system-ui, sans-serif">
                  {isBridgeSubmerged ? '⚠ BRIDGE SUBMERGED' : `Bridge 4.2m — Clearance: ${clearanceM.toFixed(1)}m`}
                </text>

                {/* Water stage arrow pointer */}
                <polygon
                  points={`${padLeft - 1},${waterY} ${padLeft - 7},${waterY - 3.5} ${padLeft - 7},${waterY + 3.5}`}
                  fill={stageColor}
                  style={{ transition: 'all 0.4s ease' }}
                />
              </svg>
            </div>

            {/* ── Footer Advisory ── */}
            <div style={{
              marginTop: '8px',
              fontSize: '0.66rem',
              color: isDangerBreached ? '#fca5a5' : '#64748b',
              lineHeight: 1.45,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '5px'
            }}>
              <span style={{ flexShrink: 0, fontSize: '0.72rem' }}>{isDangerBreached ? '⚠️' : 'ℹ️'}</span>
              <span>
                {isBridgeSubmerged
                  ? (language === 'hi' ? 'पुल जलमग्न — सड़क मार्ग पूर्ण रूप से बंद। वैकल्पिक मार्ग अपनाएं।' : 'Bridge submerged — road cutoff. Divert all traffic to alternate route.')
                  : isDangerBreached
                    ? (language === 'hi' ? 'जलस्तर HFL से ऊपर। निचले इलाकों से तुरंत निकासी करें।' : 'Stage above HFL. Evacuate low-lying riverbank settlements immediately.')
                    : (language === 'hi' ? 'जलस्तर सुरक्षित सीमा में। What-If स्लाइडर से सिंक।' : 'Stage within safe thresholds. Synced with What-If Sandbox.')}
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
