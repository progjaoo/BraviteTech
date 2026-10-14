"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './insight-carousel.module.css';

const AUTOPLAY_INTERVAL = 4500;
const DRAG_THRESHOLD = 6;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  dragging: boolean;
};

export function InsightCarousel({ children, itemCount }: { children: ReactNode; itemCount: number }) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const clickReset = useRef<number | null>(null);
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

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => () => {
    if (clickReset.current !== null) window.clearTimeout(clickReset.current);
  }, []);

  const autoPlaying = itemCount > 1 && !reducedMotion && !hovered && !focused && !interacting && inView && pageVisible;

  useEffect(() => {
    if (!autoPlaying) return;

    const timer = window.setInterval(() => {
      const element = viewport.current;
      const firstCard = element?.firstElementChild?.firstElementChild as HTMLElement | null;
      if (!element || !firstCard) return;

      const maxScroll = element.scrollWidth - element.clientWidth;
      if (maxScroll <= 1) return;

      const atEnd = element.scrollLeft >= maxScroll - 4;
      const nextLeft = atEnd
        ? 0
        : Math.min(maxScroll, element.scrollLeft + firstCard.getBoundingClientRect().width + parseFloat(getComputedStyle(element.firstElementChild as Element).columnGap || '0'));

      element.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [autoPlaying]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    };
    setInteracting(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId || event.pointerType !== 'mouse') return;

    const deltaX = event.clientX - state.startX;
    if (!state.dragging && Math.abs(deltaX) < DRAG_THRESHOLD) return;

    if (!state.dragging) {
      state.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.preventDefault();
    event.currentTarget.scrollLeft = state.startScrollLeft - deltaX;
  };

  const finishInteraction = () => {
    const wasDragging = drag.current?.dragging ?? false;
    drag.current = null;
    setInteracting(false);
    setIsDragging(false);

    if (wasDragging) {
      suppressClick.current = true;
      if (clickReset.current !== null) window.clearTimeout(clickReset.current);
      clickReset.current = window.setTimeout(() => {
        suppressClick.current = false;
        clickReset.current = null;
      }, 250);
    }
  };

  const handleClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
    if (clickReset.current !== null) window.clearTimeout(clickReset.current);
    clickReset.current = null;
  }, []);

  const moveByCard = (direction: -1 | 1) => {
    const element = viewport.current;
    const firstCard = element?.firstElementChild?.firstElementChild as HTMLElement | null;
    if (!element || !firstCard) return;
    const gap = parseFloat(getComputedStyle(element.firstElementChild as Element).columnGap || '0');
    const step = firstCard.getBoundingClientRect().width + gap;
    const maxScroll = element.scrollWidth - element.clientWidth;
    const target = direction < 0 && element.scrollLeft <= 2
      ? maxScroll
      : direction > 0 && element.scrollLeft >= maxScroll - 4
        ? 0
        : Math.max(0, Math.min(maxScroll, element.scrollLeft + step * direction));
    element.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  if (!itemCount) return null;

  return (
    <div
      ref={root}
      className={styles.root}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        ref={viewport}
        className={styles.viewport}
        data-dragging={isDragging}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Todos os insights publicados"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onLostPointerCapture={finishInteraction}
        onClickCapture={handleClickCapture}
      >
        <div className={styles.track}>{children}</div>
      </div>
      {itemCount > 1 && <div className={styles.controls} aria-label="Navegar pelos insights">
        <button type="button" className={styles.control} aria-label="Insight anterior" onClick={() => moveByCard(-1)}>
          <ArrowLeft size={17} aria-hidden="true" />
        </button>
        <button type="button" className={styles.control} aria-label="Próximo insight" onClick={() => moveByCard(1)}>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>}
      <p className={styles.hint} aria-hidden="true">Arraste ou deslize para ver todos os insights</p>
    </div>
  );
}
