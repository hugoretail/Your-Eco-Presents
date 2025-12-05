"use client";

import { useEffect, useRef, useState } from 'react';

export default function DiagonalAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [topOffset, setTopOffset] = useState<string>('70vh');

  // Detect reduced-motion and restore user override (if any)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // Keep the band strictly below the hero by reading its actual height
  useEffect(() => {
    const updateTop = () => {
      const hero = document.getElementById('hero');
      if (hero) {
        const gap = window.innerWidth >= 768 ? 200 : 120; // start even lower below the video
        const y = hero.offsetTop + hero.offsetHeight + gap;
        setTopOffset(`${y}px`);
        return;
      }
      // fallback to conservative viewport-based value
      const w = window.innerWidth;
      const vh = w >= 768 ? 104 : 88;
      setTopOffset(`${vh}vh`);
    };
    updateTop();
    window.addEventListener('resize', updateTop);
    return () => window.removeEventListener('resize', updateTop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Helper to draw a single static frame (for reduced motion without force)
    const drawStatic = () => {
      const DPR = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.floor(window.innerWidth * 1.4);
      const height = Math.floor(Math.min(720, Math.max(420, window.innerHeight * 0.56)));
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // Match /trouver green background
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, '#dcfce7');
      g.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      // 2 subtle ribbons for depth (same palette as /trouver)
      ctx.globalCompositeOperation = 'lighter';
      const makeRibbon = (yBase: number, amp: number, freq: number) => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp);
        grad.addColorStop(0, 'hsla(150,65%,52%,0.28)');
        grad.addColorStop(1, 'hsla(0,0%,100%,0)');
        ctx.fillStyle = grad;
        const thickness = 40;
        for (let x = 0; x <= width; x += 10) {
          const y = yBase + Math.sin(x * freq) * amp;
          if (x === 0) ctx.moveTo(x, y - thickness/2); else ctx.lineTo(x, y - thickness/2);
        }
        for (let x = width; x >= 0; x -= 10) {
          const y = yBase + Math.sin(x * freq) * amp;
          ctx.lineTo(x, y + thickness/2);
        }
        ctx.closePath();
        ctx.fill();
      };
      makeRibbon(height * 0.38, 24, 0.0034);
      makeRibbon(height * 0.62, 28, 0.0042);
      // top/bottom fades
      ctx.globalCompositeOperation = 'destination-out';
      const fade = 80;
      const gt = ctx.createLinearGradient(0, 0, 0, fade);
      gt.addColorStop(0, 'rgba(0,0,0,1)');
      gt.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gt; ctx.fillRect(0, 0, width, fade);
      const gb = ctx.createLinearGradient(0, height - fade, 0, height);
      gb.addColorStop(0, 'rgba(0,0,0,0)');
      gb.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gb; ctx.fillRect(0, height - fade, width, fade);
      ctx.globalCompositeOperation = 'source-over';
    };

    if (reduced) {
      drawStatic();
      return; // do not animate
    }

  const DPR = Math.min(2, window.devicePixelRatio || 1);
    // Oversize to support rotation without clipping
    let width = Math.floor(window.innerWidth * 1.4);
    let height = Math.floor(Math.min(700, Math.max(420, window.innerHeight * 0.55)));

    function resize() {
      if (!canvas || !ctx) return;
      width = Math.floor(window.innerWidth * 1.4);
      height = Math.floor(Math.min(720, Math.max(420, window.innerHeight * 0.56)));
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Waves and small orbs (lighter than /trouver)
    const waveCount = 3;
    const waves = Array.from({ length: waveCount }).map((_, i) => ({
      amp: 14 + Math.random() * 12 + i * 5,
      freq: 0.0032 + i * 0.001,
      speed: 0.14 + i * 0.045,
      phase: Math.random() * Math.PI * 2,
      hue: 145 + i * 8,
      alpha: 0.18 - i * 0.03,
      yBase: height * (0.28 + i * 0.22),
    }));
    const N = Math.floor(Math.min(14, Math.max(8, width / 140)));
    const orbs = Array.from({ length: N }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 6 + Math.random() * 18,
      hue: 140 + Math.random() * 30,
      alpha: 0.14 + Math.random() * 0.12,
      vx: (-0.18 + Math.random() * 0.36),
      vy: (-0.14 + Math.random() * 0.28),
      dr: (-0.004 + Math.random() * 0.008),
    }));

    function step() {
      if (!ctx) { rafRef.current = requestAnimationFrame(step); return; }
      // background gradient
  // /trouver-like green gradient background
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, '#dcfce7');
  g.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // waves
      ctx.globalCompositeOperation = 'lighter';
      for (const w of waves) {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0, w.yBase - w.amp, 0, w.yBase + w.amp);
        grad.addColorStop(0, `hsla(${w.hue}, 65%, 52%, ${w.alpha * 1.5})`);
        grad.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
        ctx.fillStyle = grad;
        const thickness = 44;
        for (let x = 0; x <= width; x += 12) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          if (x === 0) ctx.moveTo(x, y - thickness/2); else ctx.lineTo(x, y - thickness/2);
        }
        for (let x = width; x >= 0; x -= 12) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          ctx.lineTo(x, y + thickness/2);
        }
        ctx.closePath();
        ctx.fill();

        // subtle center stroke
        ctx.beginPath();
        for (let x = 0; x <= width; x += 10) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${w.hue - 6}, 70%, 30%, ${w.alpha * 0.4})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        w.phase += w.speed * 0.01;
      }

      // orbs
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy; o.r += o.dr;
        if (o.r < 6) { o.r = 6; o.dr = -o.dr; }
        if (o.r > 26) { o.r = 26; o.dr = -o.dr; }
        if (o.x < -40) o.x = width + 40; else if (o.x > width + 40) o.x = -40;
        if (o.y < -40) o.y = height + 40; else if (o.y > height + 40) o.y = -40;

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r*3.6);
        grad.addColorStop(0, `hsla(${o.hue}, 75%, 50%, ${o.alpha * 2.0})`);
        grad.addColorStop(1, 'hsla(0,0%,100%,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r*3.6, 0, Math.PI*2);
        ctx.fill();

        // small core
        ctx.fillStyle = `hsla(${o.hue}, 75%, 35%, ${o.alpha*1.2})`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r*0.8, 0, Math.PI*2);
        ctx.fill();
      }

      // fades edges to blend with page
      ctx.globalCompositeOperation = 'destination-out';
      const fade = 80;
      const gt = ctx.createLinearGradient(0, 0, 0, fade);
      gt.addColorStop(0, 'rgba(0,0,0,1)');
      gt.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gt; ctx.fillRect(0, 0, width, fade);
      const gb = ctx.createLinearGradient(0, height - fade, 0, height);
      gb.addColorStop(0, 'rgba(0,0,0,0)');
      gb.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gb; ctx.fillRect(0, height - fade, width, fade);
      ctx.globalCompositeOperation = 'source-over';

      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  // The wrapper provides the diagonal effect via rotation and offset
  return (
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: topOffset,
        left: '-25vw',
        width: '150vw',
        height: '56vh',
        transform: 'rotate(-12deg)',
        transformOrigin: 'center',
      }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
