import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';

export interface RadarFrame {
  id: string;
  timeLabel: string;
  utcTime: string;
  status: 'HISTORICAL' | 'LIVE' | 'NOWCAST' | 'FORECAST';
  peakDbz: number;
  description: string;
}

export const RADAR_FRAMES: RadarFrame[] = [
  { id: 'T-3H', timeLabel: '-3h', utcTime: '07:30 IST', status: 'HISTORICAL', peakDbz: 32, description: 'Stratiform moisture influx over lower foothills' },
  { id: 'T-2H', timeLabel: '-2h', utcTime: '08:30 IST', status: 'HISTORICAL', peakDbz: 42, description: 'Orographic lift along Beas & Sutlej ridges' },
  { id: 'T-1H', timeLabel: '-1h', utcTime: '09:30 IST', status: 'HISTORICAL', peakDbz: 54, description: 'Rapid convective tower buildup' },
  { id: 'NOW', timeLabel: 'NOW', utcTime: '10:30 IST', status: 'LIVE', peakDbz: 65, description: 'Cloudburst core over Mandi, Kullu & Chamoli' },
  { id: 'T+30M', timeLabel: '+30m', utcTime: '11:00 IST', status: 'NOWCAST', peakDbz: 68, description: 'Wind shear: flash flood runoff peak' },
  { id: 'T+60M', timeLabel: '+60m', utcTime: '11:30 IST', status: 'FORECAST', peakDbz: 50, description: 'Storm tracking northeast toward pass' }
];

const STATUS_COLORS: Record<string, string> = {
  HISTORICAL: '#3b82f6',
  LIVE: '#10b981',
  NOWCAST: '#f59e0b',
  FORECAST: '#8b5cf6'
};

const DBZ_SEGMENTS = [
  { label: '15', color: '#22c55e' },
  { label: '30', color: '#84cc16' },
  { label: '45', color: '#eab308' },
  { label: '55', color: '#f97316' },
  { label: '65+', color: '#ef4444' },
];

export const DopplerRadarPlayer: React.FC = () => {
  const { layers, toggleLayer, language } = useFlood();
  const [currentFrameIdx, setCurrentFrameIdx] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeFrame = RADAR_FRAMES[currentFrameIdx];
  const statusColor = STATUS_COLORS[activeFrame.status] || '#3b82f6';

  // Dispatch radar frame change event for GISMap2D and GISMap3D sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('imd-radar-frame-change', {
      detail: { frame: activeFrame, frameIndex: currentFrameIdx }
    }));
  }, [currentFrameIdx, activeFrame]);

  // Loop player
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = speed === 2 ? 700 : 1400;
      timerRef.current = setInterval(() => {
        setCurrentFrameIdx(prev => (prev + 1) % RADAR_FRAMES.length);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed]);

  const stepFrame = useCallback((dir: 1 | -1) => {
    setCurrentFrameIdx(prev => (prev + dir + RADAR_FRAMES.length) % RADAR_FRAMES.length);
    if (isPlaying) setIsPlaying(false);
  }, [isPlaying]);

  if (!layers.dopplerRadar) return null;

  // --- Inline keyframe styles injected once ---
  const keyframeId = 'doppler-radar-keyframes';
  if (!document.getElementById(keyframeId)) {
    const style = document.createElement('style');
    style.id = keyframeId;
    style.textContent = `
      @keyframes radarPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @keyframes radarSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      .doppler-timeline-dot:hover { transform: scale(1.3) !important; }
      .doppler-timeline-dot { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '80px',
      right: '16px',
      zIndex: 840,
      width: isExpanded ? '380px' : '220px',
      maxWidth: 'calc(100vw - 32px)',
      background: 'linear-gradient(170deg, rgba(13, 20, 38, 0.96) 0%, rgba(8, 14, 28, 0.98) 100%)',
      backdropFilter: 'blur(24px) saturate(1.6)',
      border: `1px solid ${statusColor}33`,
      borderRadius: '14px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px ${statusColor}15`,
      color: '#f1f5f9',
      overflow: 'hidden',
      transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
      animation: 'radarSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
    }}>

      {/* ─── Compact Header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Animated radar icon */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: `linear-gradient(135deg, ${statusColor}30, ${statusColor}10)`,
            border: `1px solid ${statusColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.95rem', flexShrink: 0
          }}>📡</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.76rem', fontWeight: 700, color: '#e2e8f0',
              letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '7px'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                {language === 'hi' ? 'डॉपलर रडार' : 'IMD RADAR'}
              </span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700,
                padding: '1px 7px', borderRadius: '6px',
                background: `${statusColor}25`, color: statusColor,
                border: `1px solid ${statusColor}40`,
                letterSpacing: '0.06em',
                animation: activeFrame.status === 'LIVE' ? 'radarPulse 2s ease-in-out infinite' : 'none'
              }}>
                {activeFrame.status}
              </span>
            </div>
            {isExpanded && (
              <div style={{
                fontSize: '0.65rem', color: '#64748b', marginTop: '1px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                Patiala • Kufri (HP) • Mohanbari (NE)
              </div>
            )}
          </div>
        </div>

        {/* Header action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
            padding: '4px 6px', fontSize: '0.8rem', borderRadius: '6px',
            transition: 'color 0.15s'
          }} title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? '▾' : '▸'}
          </button>
          <button onClick={() => toggleLayer('dopplerRadar')} style={{
            background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
            padding: '4px 6px', fontSize: '0.85rem', borderRadius: '6px',
            transition: 'color 0.15s'
          }} title="Close Radar">✕</button>
        </div>
      </div>

      {/* ─── Expanded Body ─── */}
      {isExpanded && (
        <div style={{
          padding: '12px 14px 14px',
          animation: 'radarSlideUp 0.25s ease'
        }}>

          {/* ── Transport Controls Row ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px'
          }}>
            {/* Step Back */}
            <button onClick={() => stepFrame(-1)} style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
              transition: 'all 0.15s', flexShrink: 0
            }} title="Previous Frame">⏮</button>

            {/* Play / Pause */}
            <button onClick={() => setIsPlaying(!isPlaying)} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: isPlaying
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}cc 100%)`,
              border: 'none', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
              boxShadow: isPlaying
                ? '0 0 16px rgba(239,68,68,0.45)'
                : `0 0 16px ${statusColor}35`,
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)'
            }} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Step Forward */}
            <button onClick={() => stepFrame(1)} style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
              transition: 'all 0.15s', flexShrink: 0
            }} title="Next Frame">⏭</button>

            {/* Current Time Display */}
            <div style={{
              flex: 1, textAlign: 'center', minWidth: 0
            }}>
              <div style={{
                fontSize: '0.88rem', fontWeight: 800, color: '#f1f5f9',
                letterSpacing: '-0.01em'
              }}>
                {activeFrame.timeLabel}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>
                {activeFrame.utcTime}
              </div>
            </div>

            {/* Speed + dBZ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => setSpeed(s => s === 1 ? 2 : 1)} style={{
                background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: speed === 2 ? '#f59e0b' : '#94a3b8',
                padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s'
              }} title="Toggle Speed">
                {speed}×
              </button>
              <div style={{
                background: activeFrame.peakDbz >= 60 ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.7)',
                border: `1px solid ${activeFrame.peakDbz >= 60 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', padding: '4px 8px', textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 800,
                  color: activeFrame.peakDbz >= 60 ? '#f87171' : '#f59e0b'
                }}>
                  {activeFrame.peakDbz}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600 }}>dBZ</div>
              </div>
            </div>
          </div>

          {/* ── Segmented Timeline Dots ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0',
            background: 'rgba(15,23,42,0.6)', borderRadius: '10px',
            padding: '8px 10px', marginBottom: '12px',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            {RADAR_FRAMES.map((frame, i) => {
              const isActive = i === currentFrameIdx;
              const dotColor = STATUS_COLORS[frame.status];
              const isPast = i < currentFrameIdx;
              return (
                <React.Fragment key={frame.id}>
                  {/* Connector line */}
                  {i > 0 && (
                    <div style={{
                      flex: 1, height: '2px',
                      background: isPast ? `${dotColor}80` : 'rgba(71,85,105,0.4)',
                      transition: 'background 0.3s ease'
                    }} />
                  )}
                  {/* Dot + label */}
                  <div
                    className="doppler-timeline-dot"
                    onClick={() => { setCurrentFrameIdx(i); if (isPlaying) setIsPlaying(false); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: 'pointer', position: 'relative',
                      transform: isActive ? 'scale(1.15)' : 'scale(1)'
                    }}
                  >
                    <div style={{
                      width: isActive ? '14px' : '10px',
                      height: isActive ? '14px' : '10px',
                      borderRadius: '50%',
                      background: isActive ? dotColor : `${dotColor}50`,
                      border: isActive ? `2px solid #ffffff` : `1.5px solid ${dotColor}60`,
                      boxShadow: isActive ? `0 0 10px ${dotColor}60` : 'none',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)'
                    }} />
                    <span style={{
                      fontSize: '0.58rem', fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#f1f5f9' : '#64748b',
                      marginTop: '4px', whiteSpace: 'nowrap',
                      transition: 'color 0.2s'
                    }}>
                      {frame.timeLabel}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Description + dBZ color bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{
              fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500,
              flex: 1, minWidth: 0, lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const
            }}>
              {activeFrame.description}
            </div>

            {/* dBZ color scale */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0
            }}>
              <span style={{ fontSize: '0.58rem', color: '#475569', fontWeight: 700 }}>dBZ</span>
              <div style={{
                display: 'flex', height: '8px', borderRadius: '4px',
                overflow: 'hidden', width: '80px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {DBZ_SEGMENTS.map(seg => (
                  <div key={seg.label} style={{ flex: 1, background: seg.color }} title={`${seg.label} dBZ`} />
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
