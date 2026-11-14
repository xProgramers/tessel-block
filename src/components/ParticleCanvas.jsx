import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/** Overlay de partículas em Canvas (tela cheia, sem capturar eventos). */
const ParticleCanvas = forwardRef(function ParticleCanvas(_, ref) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const tick = (now) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const list = particles.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      p.vx *= 1 - 1.6 * dt;
      p.vy = p.vy * (1 - 1.6 * dt) + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size * (0.4 + 0.6 * k);
      if (p.shape === 0) {
        ctx.fillRect(-s / 2, -s / 2, s, s);
      } else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // estrela/brilho de 4 pontas
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.22, -s * 0.22);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.22, s * 0.22);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.22, s * 0.22);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.22, -s * 0.22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (list.length) raf.current = requestAnimationFrame(tick);
    else raf.current = 0;
  };

  useImperativeHandle(ref, () => ({
    burst(x, y, colors, count = 10, power = 1) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (140 + Math.random() * 380) * power;
        const life = 0.55 + Math.random() * 0.55;
        particles.current.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 160 * power,
          g: 1100,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 14,
          size: 4 + Math.random() * 6,
          color: colors[(Math.random() * colors.length) | 0],
          shape: Math.random() < 0.18 ? 2 : Math.random() < 0.5 ? 0 : 1,
          life,
          max: life,
        });
      }
      if (particles.current.length > 900) particles.current.splice(0, particles.current.length - 900);
      if (!raf.current) {
        last.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }
    },
  }));

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[65] h-full w-full" />;
});

export default ParticleCanvas;
