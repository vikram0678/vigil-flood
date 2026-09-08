import React, { useEffect, useRef } from 'react';
import { useFlood } from '../../context/FloodContext';

interface Particle {
  x: number;
  y: number;
  speed: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const NullschoolCanvas: React.FC = () => {
  const { layers, viewMode } = useFlood();
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

    const particles: Particle[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1.2 + Math.random() * 2.2,
        radius: 1.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.7,
        life: Math.random() * 100,
        maxLife: 60 + Math.random() * 60
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.life++;
        // Downhill Beas gorge river flow vector
        p.x -= p.speed * 0.85;
        p.y += p.speed * 0.55;

        if (p.life >= p.maxLife || p.x < 0 || p.y > canvas.height) {
          p.x = canvas.width * 0.4 + Math.random() * canvas.width * 0.6;
          p.y = Math.random() * canvas.height * 0.5;
          p.life = 0;
        }

        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

        // Draw flowing glowing fluid particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fill();

        // Draw trailing tail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speed * 4, p.y - p.speed * 2.5);
        ctx.strokeStyle = `rgba(56, 189, 248, ${currentAlpha * 0.4})`;
        ctx.lineWidth = p.radius * 0.8;
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, layers.particles]);

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
