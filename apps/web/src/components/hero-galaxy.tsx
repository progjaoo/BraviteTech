"use client";

import { useEffect, useRef } from 'react';
import { createCanvasEngine, type HeroEngine, type HeroFrame } from './hero-field';

/** One native RAF owns the background; GSAP owns page timelines, Motion component transitions. */
export function HeroGalaxy() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current, hero = element?.closest('section');
    if (!element || !hero) return;
    let cancelled = false, engine: HeroEngine | null = null;
    let visible = true, running = false, raf = 0, previousTime: number | null = null;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const frame: HeroFrame = { time: 0, pointerX: 0, pointerY: 0, influence: 0 };
    const target = { x: 0, y: 0, influence: 0 };

    function size(next: HeroEngine) {
      const w = element!.clientWidth, h = element!.clientHeight;
      if (w && h) next.resize(w, h, Math.min(window.devicePixelRatio || 1, w < 760 ? 1.25 : 1.5));
    }
    function attach(next: HeroEngine | null) {
      if (cancelled) { next?.dispose(); return; }
      if (next) {
        try { size(next); next.render(frame); }
        catch { next.dispose(); if (next.kind === 'canvas2d') attach(null); return; }
      }
      const previous = engine; engine = next;
      if (next) element!.appendChild(next.canvas);
      element!.dataset.renderer = next ? 'ready' : 'fallback';
      element!.dataset.engine = next?.kind ?? 'static';
      previous?.dispose();
      activity();
    }
    function fallback() {
      // Both WebGL creation errors and runtime context loss keep an animated background.
      try { attach(createCanvasEngine()); }
      catch { attach(null); }
    }
    function render() {
      try { engine?.render(frame); }
      catch { if (engine?.kind === 'webgl') fallback(); else attach(null); }
    }
    function tick(time: number) {
      raf = 0;
      if (!running || cancelled) return;
      const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      frame.time += delta;
      const ease = 1 - Math.exp(-delta * 4.5);
      frame.pointerX += (target.x - frame.pointerX) * ease;
      frame.pointerY += (target.y - frame.pointerY) * ease;
      frame.influence += (target.influence - frame.influence) * ease;
      render();
      if (running && !cancelled) raf = requestAnimationFrame(tick);
    }
    function activity() {
      const next = !!engine && visible && !document.hidden && !cancelled;
      element!.dataset.motion = next ? 'running' : 'paused';
      if (next === running) return;
      running = next; previousTime = null;
      if (raf) cancelAnimationFrame(raf);
      raf = next ? requestAnimationFrame(tick) : 0;
    }
    function resize() {
      try { if (engine) { size(engine); render(); } }
      catch { if (engine?.kind === 'webgl') fallback(); else attach(null); }
    }
    function leave() { target.x = 0; target.y = 0; target.influence = 0; }
    function move(event: PointerEvent) {
      if (!fine.matches || event.pointerType === 'touch') return;
      const bounds = hero!.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      target.y = Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height * 2));
      target.influence = 1;
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; activity(); });
    const dimensions = new ResizeObserver(resize);
    observer.observe(hero); dimensions.observe(element);
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', activity); fine.addEventListener('change', leave);
    fallback(); // Visible, moving from hydration; never wait for the Three.js chunk or idle callback.
    void import('./hero-webgl').then(({ createWebGLEngine }) => {
      if (cancelled) return;
      const next = createWebGLEngine(fallback);
      if (next) attach(next);
    }).catch(() => { /* Keep the already active Canvas2D engine if import/initialization fails. */ });

    return () => {
      cancelled = true; running = false;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect(); dimensions.disconnect();
      hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', activity); fine.removeEventListener('change', leave);
      engine?.dispose(); engine = null;
    };
  }, []);

  return <div ref={host} className="hero-galaxy" data-renderer="loading" aria-hidden="true">
    <div className="galaxy-fallback">
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#2D6BFF" strokeOpacity=".12">
        <path d="M-160 780C210 290 1090 900 1550 90M-190 815C280 250 1060 940 1570 30M-140 735C240 340 1120 850 1520 150"/>
      </svg>
      <span className="fallback-planet fallback-planet-blue"/>
      <span className="fallback-planet fallback-planet-ringed"/>
      <span className="fallback-planet fallback-planet-moon"/>
    </div>
  </div>;
}
