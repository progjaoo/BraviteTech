"use client";

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { CaseStudy } from '@bravite/shared';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { CaseCard } from './cards';
import styles from './case-carousel.module.css';

const AUTOPLAY_INTERVAL = 4500;
const DRAG_THRESHOLD = 6;

export function CaseCarousel({ cases }: { cases: CaseStudy[] }) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; scrollLeft: number; active: boolean } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    const updateVisibility = () => setPageVisible(!document.hidden);
    observer.observe(element);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  const moveByCard = (direction: -1 | 1) => {
    const element = viewport.current;
    const card = element?.firstElementChild?.firstElementChild as HTMLElement | null;
    if (!element || !card) return;
    const track = element.firstElementChild as HTMLElement;
    const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
    const maxScroll = element.scrollWidth - element.clientWidth;
    const target = direction < 0 && element.scrollLeft <= 2 ? maxScroll
      : direction > 0 && element.scrollLeft >= maxScroll - 4 ? 0
        : Math.max(0, Math.min(maxScroll, element.scrollLeft + direction * step));
    element.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const autoPlaying = cases.length > 1 && !reducedMotion && !hovered && !focused && !interacting && inView && pageVisible;
  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setInterval(() => moveByCard(1), AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [autoPlaying, reducedMotion, cases.length]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, active: false };
    setInteracting(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId || event.pointerType !== 'mouse') return;
    const delta = event.clientX - state.startX;
    if (!state.active && Math.abs(delta) < DRAG_THRESHOLD) return;
    if (!state.active) { state.active = true; event.currentTarget.setPointerCapture(event.pointerId); setIsDragging(true); }
    event.preventDefault();
    event.currentTarget.scrollLeft = state.scrollLeft - delta;
  };
  const finishPointer = () => { drag.current = null; setInteracting(false); setIsDragging(false); };

  if (!cases.length) return null;
  return <div ref={root} className={styles.root}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div ref={viewport} className={styles.viewport} data-dragging={isDragging} role="region" aria-roledescription="carrossel" aria-label="Projetos em destaque" tabIndex={0}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} onLostPointerCapture={finishPointer}>
      <div className={styles.cards}>{cases.map((project, index) => <CaseCard key={project.id} project={project} index={index}/>)}</div>
    </div>
    {cases.length > 1 && <div className={styles.arrows} aria-label="Navegar pelos projetos">
      <button className={styles.arrow} type="button" aria-label="Projeto anterior" onClick={() => moveByCard(-1)}><ArrowLeft size={17}/></button>
      <button className={styles.arrow} type="button" aria-label="Próximo projeto" onClick={() => moveByCard(1)}><ArrowRight size={17}/></button>
    </div>}
    <p className={styles.hint} aria-hidden="true">Arraste ou deslize para explorar os projetos</p>
  </div>;
}
