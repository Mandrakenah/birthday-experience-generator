'use client';

// Spec Section 15 — Canvas fireworks, no third-party libraries.
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export function Fireworks({ duration = 5000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const colors = ['#FF6B9D', '#C44DFF', '#FFD700', '#FF4E50', '#FC89AC', '#7DD3FC', '#A78BFA'];

    const burst = (x: number, y: number) => {
      const count = 80;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3,
        });
      }
    };

    // Schedule bursts over the duration
    const burstCount = 8;
    const interval = duration / burstCount;
    const burstTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < burstCount; i++) {
      burstTimers.push(
        setTimeout(
          () =>
            burst(
              canvas.width * (0.15 + Math.random() * 0.7),
              canvas.height * (0.15 + Math.random() * 0.4)
            ),
          i * interval
        )
      );
    }

    let frame: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= 0.012;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      burstTimers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, [duration]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" aria-hidden="true" />
  );
}
