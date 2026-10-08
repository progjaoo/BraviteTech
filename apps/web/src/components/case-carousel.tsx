"use client";

import { useEffect, useRef, useState } from 'react';
import type { CaseStudy } from '@bravite/shared';
import { Pause, Play } from 'lucide-react';
import { CaseCard } from './cards';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './case-carousel.module.css';

export function CaseCarousel({ cases }: { cases: CaseStudy[] }) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [perPage, setPerPage] = useState(2);
  const [page, setPage] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setPerPage(media.matches ? 1 : 2);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

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

  const pageCount = Math.ceil(cases.length / perPage);
  useEffect(() => setPage(0), [perPage]);

  const autoPlaying = pageCount > 1 && !reducedMotion && !pausedByUser && !hovered && !focused && inView && pageVisible;
  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setInterval(() => setPage(current => (current + 1) % pageCount), 7000);
    return () => window.clearInterval(timer);
  }, [autoPlaying, pageCount]);

  if (!cases.length) return null;

  const firstCase = page * perPage;
  const visibleCases = cases.slice(firstCase, firstCase + perPage);
  const lastCase = firstCase + visibleCases.length;
  const moveTo = (nextPage: number) => setPage((nextPage + pageCount) % pageCount);

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
      <div className={styles.viewport} role="region" aria-roledescription="carrossel" aria-label="Cases em destaque">
        <div key={`${page}-${perPage}`} className={styles.cards} aria-live={autoPlaying ? 'off' : 'polite'} aria-atomic="true">
          {visibleCases.map((project, index) => (
            <CaseCard key={project.id} project={project} index={firstCase + index} />
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className={styles.controls}>
          <span className={styles.counter} aria-live={autoPlaying ? 'off' : 'polite'} aria-atomic="true">
            {String(firstCase + 1).padStart(2, '0')}–{String(lastCase).padStart(2, '0')} <span>/ {String(cases.length).padStart(2, '0')}</span>
          </span>
          <div className={styles.actions}>
            {!reducedMotion && (
              <button
                className={styles.button}
                type="button"
                aria-label={pausedByUser ? 'Retomar transição automática' : 'Pausar transição automática'}
                aria-pressed={pausedByUser}
                onClick={() => setPausedByUser(value => !value)}
              >
                {pausedByUser ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              </button>
            )}
            <div className={styles.dots} role="group" aria-label="Selecionar página de cases">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={styles.dot}
                  data-active={page === index}
                  aria-label={`Mostrar página ${index + 1} de ${pageCount}`}
                  aria-current={page === index ? 'true' : undefined}
                  onClick={() => moveTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
