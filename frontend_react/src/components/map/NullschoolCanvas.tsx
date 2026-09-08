import React, { useEffect, useRef } from 'react';
import { useFlood } from '../../context/FloodContext';

interface HydroParticle {
  stream: [number, number][];
  progress: number;
  speed: number;
  size: number;
  alpha: number;
}

function getPointAlongPolyline(pts: [number, number][], progress: number): [number, number] {
  if (!pts || pts.length === 0) return [0, 0];
  if (pts.length === 1) return pts[0];

  const totalSegments = pts.length - 1;
  const scaled = progress * totalSegments;
  const segIdx = Math.min(Math.floor(scaled), totalSegments - 1);
  const segProgress = scaled - segIdx;

  const p1 = pts[segIdx];
  const p2 = pts[segIdx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segProgress;
  const lng = p1[1] + (p2[1] - p1[1]) * segProgress;
  return [lat, lng];
}

export const NullschoolCanvas: React.FC = () => {
  const { layers, viewMode, villages } = useFlood();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (viewMode !== '2d' || !layers.particles) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Collect valid streams from all monitored villages
    const validStreams = villages
      .filter(v => v.river_stream && v.river_stream.length > 1)
      .map(v => v.river_stream as [number, number][]);

    const particles: HydroParticle[] = [];
    const count = 120;

    const fallbackStream: [number, number][] = [
      [31.684, 77.064],
      [31.678, 77.061],
      [31.672, 77.058],
      [31.664, 77.057]
    ];

    for (let i = 0; i < count; i++) {
      const stream: [number, number][] = validStreams.length > 0 
        ? (validStreams[i % validStreams.length] as [number, number][])
        : fallbackStream;

      particles.push({
        stream,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        size: 1.8 + Math.random() * 2.2,
        alpha: 0.4 + Math.random() * 0.6
      });
    }

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const map = (window as any).leafletMap;

      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1.0) p.progress = 0.0;

        let ptX = 0;
        let ptY = 0;
        let prevPtX = 0;
        let prevPtY = 0;

        if (map && map.latLngToContainerPoint) {
          const [lat, lng] = getPointAlongPolyline(p.stream, p.progress);
          const screenPt = map.latLngToContainerPoint([lat, lng]);
          ptX = screenPt.x;
          ptY = screenPt.y;

          const prevProgress = Math.max(0, p.progress - 0.035);
          const [prevLat, prevLng] = getPointAlongPolyline(p.stream, prevProgress);
          const prevScreenPt = map.latLngToContainerPoint([prevLat, prevLng]);
          prevPtX = prevScreenPt.x;
          prevPtY = prevScreenPt.y;
        } else {
          // Fallback downhill vector
          ptX = (w * 0.5) - (p.progress * w * 0.4);
          ptY = (h * 0.2) + (p.progress * h * 0.6);
          prevPtX = ptX + 10;
          prevPtY = ptY - 6;
        }

        if (ptX >= 0 && ptX <= w && ptY >= 0 && ptY <= h) {
          // Draw fluid stream tail
          ctx.beginPath();
          ctx.moveTo(prevPtX, prevPtY);
          ctx.lineTo(ptX, ptY);
          ctx.strokeStyle = `rgba(6, 182, 212, ${p.alpha * 0.75})`;
          ctx.lineWidth = p.size * 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Luminous glowing head particle
          ctx.beginPath();
          ctx.arc(ptX, ptY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fill();

          // Spark core
          ctx.beginPath();
          ctx.arc(ptX, ptY, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, layers.particles, villages]);

  if (viewMode !== '2d' || !layers.particles) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="nullschool-particle-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 450
      }}
    />
  );
};
