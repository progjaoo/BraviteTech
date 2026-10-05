"use client";

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Marquee from 'react-fast-marquee';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { defaultTechnologies, type Technology } from '@/lib/technology-icons';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './technology-marquee.module.css';

export type { Technology } from '@/lib/technology-icons';

export interface TechnologyMarqueeProps {
  technologies?: readonly Technology[];
  speed?: number;
  id?: string;
}

function TechnologyItem({ technology }: { technology: Technology }) {
  const Icon = technology.icon;
  const style = { '--technology-color': technology.color } as CSSProperties;

  return (
    <span className={styles.item} style={style}>
      {typeof Icon === 'string' ? (
        <span className={styles.badge} aria-hidden="true">{Icon}</span>
      ) : (
        <Icon className={styles.icon} aria-hidden="true" focusable="false" />
      )}
      <span>{technology.name}</span>
    </span>
  );
}

export function TechnologyMarquee({
  technologies = defaultTechnologies,
  speed = 50,
  id = 'tecnologias',
}: TechnologyMarqueeProps = {}) {
  const root = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    setReady(true);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const updateVisibility = () => setPageVisible(!document.hidden);
    observer.observe(element);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [technologies.length]);

  if (!technologies.length) return null;

  const staticMode = !ready || reducedMotion || technologies.length < 2;
  const playing = !staticMode && !paused && !hovered && visible && pageVisible;
  const pauseLabel = reducedMotion
    ? 'Animação desativada pela preferência de movimento reduzido'
    : paused ? 'Retomar carrossel de tecnologias' : 'Pausar carrossel de tecnologias';

  return (
    <section
      id={id}
      ref={root}
      className={`tech-strip ${styles.section}`}
      aria-label="Tecnologias do nosso desenvolvimento"
      data-motion={staticMode ? 'static' : playing ? 'running' : 'paused'}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="container tech-marquee-heading">
        <span>ENGENHARIA PARA EVOLUIR</span>
        <div className="tech-marquee-actions">
          <Link href="/sobre#tecnologia">Tecnologia com critério<ArrowRight size={15} /></Link>
          <button
            type="button"
            className="icon-button"
            aria-label={pauseLabel}
            aria-pressed={paused || reducedMotion}
            disabled={reducedMotion || technologies.length < 2}
            onClick={() => setPaused(value => !value)}
          >
            {paused || reducedMotion ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {staticMode ? (
        <div className="container">
          <ul className={styles.staticList}>
            {technologies.map(technology => (
              <li key={technology.name}><TechnologyItem technology={technology} /></li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {/* Expose one list to assistive technology; hide every visual repetition. */}
          <ul className={styles.srOnly}>
            {technologies.map(technology => <li key={technology.name}>{technology.name}</li>)}
          </ul>
          <div className={styles.frame} aria-hidden="true">
            <Marquee
              className={styles.viewport}
              autoFill
              loop={0}
              play={playing}
              pauseOnHover
              speed={Number.isFinite(speed) && speed > 0 ? speed : 50}
              gradient
              gradientColor="var(--black)"
              gradientWidth="clamp(24px, 6vw, 88px)"
            >
              {technologies.map(technology => (
                <TechnologyItem key={technology.name} technology={technology} />
              ))}
            </Marquee>
          </div>
        </>
      )}
    </section>
  );
}
