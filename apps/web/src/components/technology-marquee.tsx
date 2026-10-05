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
      <Icon className={styles.icon} aria-hidden="true" focusable="false" />
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
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const updateVisibility = () => setPageVisible(!document.hidden);
    observer.observe(element);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  if (!technologies.length) return null;

  const staticMode = technologies.length < 2;
  const playing = !staticMode && !paused && visible && pageVisible;
  const requestedSpeed = Number.isFinite(speed) && speed > 0 ? speed : 50;
  const marqueeSpeed = reducedMotion ? Math.min(requestedSpeed, 24) : requestedSpeed;
  const pauseLabel = paused ? 'Retomar carrossel de tecnologias' : 'Pausar carrossel de tecnologias';

  return (
    <section
      id={id}
      ref={root}
      className={`tech-strip ${styles.section}`}
      aria-label="Tecnologias do nosso desenvolvimento"
      data-motion={staticMode ? 'static' : playing ? 'running' : 'paused'}
    >
      <div className="container tech-marquee-heading">
        <span>ENGENHARIA PARA EVOLUIR</span>
        <div className="tech-marquee-actions">
          <Link href="/sobre#tecnologia">Tecnologia com critério<ArrowRight size={15} /></Link>
          <button
            type="button"
            className="icon-button"
            aria-label={pauseLabel}
            aria-pressed={paused}
            disabled={technologies.length < 2}
            onClick={() => setPaused(value => !value)}
          >
            {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
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
              speed={marqueeSpeed}
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
