"use client";

import { useEffect, useRef } from 'react';

// Animation douce d'orbes flottants en canvas, sous le formulaire de /trouver.
// Objectifs:
// - Pousser le footer sous la ligne de flottaison sans rajouter de contenu artificiel
// - Être léger, discret, et respecter prefers-reduced-motion
// - Désactiver toute interaction (pointer-events: none)

type Orb = { x: number; y: number; r: number; hue: number; alpha: number; vx: number; vy: number; dr: number };

export default function BelowFoldAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mqReduce.matches) return; // respect reduced motion

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let width = window.innerWidth; // full-bleed = largeur viewport
    let height = 520; // plus haut par défaut
    function resize() {
      if (!canvas || !ctx) return;
      width = Math.max(800, window.innerWidth);
      height = Math.max(420, Math.min(760, Math.floor(width * 0.38))); // ratio plus généreux
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Ribbons (bandes ondulées) + Orbes
    const N = Math.floor(Math.min(26, Math.max(14, width / 70)));
    const orbs: Orb[] = Array.from({ length: N }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 8 + Math.random() * 28,
      hue: 140 + Math.random() * 40, // verts doux
      alpha: 0.16 + Math.random() * 0.14,
      vx: (-0.22 + Math.random() * 0.44),
      vy: (-0.18 + Math.random() * 0.36),
      dr: (-0.005 + Math.random() * 0.01),
    }));

    // paramètres des rubans
    const waveCount = 3;
    const waves = Array.from({ length: waveCount }).map((_, i) => ({
      amp: 20 + Math.random() * 20 + i * 7,
      freq: 0.0034 + i * 0.0011,
      speed: 0.15 + i * 0.048, // lissage
      phase: Math.random() * Math.PI * 2,
      hue: 140 + i * 8,
      alpha: 0.26 - i * 0.04, // plus visible
      yBase: height * (0.35 + i * 0.18),
    }));

    function step() {
  if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // léger dégradé de fond
  const g = ctx.createLinearGradient(0, 0, width, height);
  // dégradé verdâtre plus présent (teintes Tailwind green-100/200-ish)
  g.addColorStop(0, '#dcfce7');
  g.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // rubans ondulés en arrière-plan
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const w of waves) {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0, w.yBase - w.amp, 0, w.yBase + w.amp);
        grad.addColorStop(0, `hsla(${w.hue}, 65%, 52%, ${w.alpha * 1.5})`);
        grad.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
        ctx.fillStyle = grad;
        const thickness = 44;
        // bande supérieure
        for (let x = 0; x <= width; x += 10) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          if (x === 0) ctx.moveTo(x, y - thickness/2);
          else ctx.lineTo(x, y - thickness/2);
        }
        // bande inférieure (retour)
        for (let x = width; x >= 0; x -= 10) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          ctx.lineTo(x, y + thickness/2);
        }
        ctx.closePath();
        ctx.fill();
        // Ligne centrale pour le contraste
        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const y = w.yBase + Math.sin(x * w.freq + w.phase) * w.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${w.hue - 6}, 70%, 30%, ${w.alpha * 0.4})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        w.phase += w.speed * 0.01;
      }
      ctx.restore();

  // orbes lumineux
      ctx.globalCompositeOperation = 'lighter'; // mode d'addition pour un glow plus visible
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy; o.r += o.dr;
        if (o.r < 6) { o.r = 6; o.dr = -o.dr; }
        if (o.r > 32) { o.r = 32; o.dr = -o.dr; }
        // wrap doux
        if (o.x < -40) o.x = width + 40; else if (o.x > width + 40) o.x = -40;
        if (o.y < -40) o.y = height + 40; else if (o.y > height + 40) o.y = -40;

        // glow orb
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r*3.6);
        grad.addColorStop(0, `hsla(${o.hue}, 75%, 50%, ${o.alpha * 2.2})`);
        grad.addColorStop(1, 'hsla(0,0%,100%,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r*3.6, 0, Math.PI*2);
        ctx.fill();

        // noyau
        ctx.fillStyle = `hsla(${o.hue}, 75%, 35%, ${o.alpha*1.5})`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r*0.85, 0, Math.PI*2);
        ctx.fill();
      }
  ctx.globalCompositeOperation = 'source-over';

  // FADES haut/bas pour éviter une coupure brutale avec le fond de page
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  // bas
  const fadeBottom = 140;
  const gb = ctx.createLinearGradient(0, height - fadeBottom, 0, height);
  gb.addColorStop(0, 'rgba(0,0,0,0)');
  gb.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = gb;
  ctx.fillRect(0, height - fadeBottom, width, fadeBottom);
  // haut
  const fadeTop = 80;
  const gt = ctx.createLinearGradient(0, 0, 0, fadeTop);
  gt.addColorStop(0, 'rgba(0,0,0,1)');
  gt.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gt;
  ctx.fillRect(0, 0, width, fadeTop);
  ctx.restore();
      // petit debug visuel (coin bas-droite): point animé pour vérifier que ça bouge
  const t = performance.now() / 1000;
      const r = 6 + Math.sin(t*3) * 3;
      ctx.fillStyle = 'rgba(16,115,84,0.6)';
      ctx.beginPath();
      ctx.arc(width - 20, height - 18, r, 0, Math.PI*2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative mt-16 full-bleed">
      {/* Respecte la préférence système: aucune option pour forcer l’animation */}
      <canvas ref={canvasRef} className="block w-full pointer-events-none" aria-hidden />
    </div>
  );
}
