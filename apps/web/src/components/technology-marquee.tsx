"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import Marquee from 'react-fast-marquee';
import { ArrowRight } from 'lucide-react';
import { defaultTechnologies, type Technology } from '@/lib/technology-icons';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './technology-marquee.module.css';

export type { Technology } from '@/lib/technology-icons';

export interface TechnologyMarqueeProps {
  technologies?: readonly Technology[];
  speed?: number;
  id?: string;
}

type MarqueeAnimationSnapshot = {
  animation: Animation;
  currentTime: number;
  duration: number;
};

function getMarqueeAnimations(element: HTMLElement): MarqueeAnimationSnapshot[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.rfm-marquee')).flatMap(track =>
    track.getAnimations().flatMap(animation => {
      const currentTime = animation.currentTime;
      const duration = animation.effect?.getComputedTiming().duration;
      if (
        typeof currentTime !== 'number'
        || typeof duration !== 'number'
        || !Number.isFinite(duration)
        || duration <= 0
      ) {
        return [];
      }
      return [{ animation, currentTime, duration }];
    }),
  );
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
  const marquee = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
    vertical: boolean;
    pixelsPerSecond: number;
    animations: MarqueeAnimationSnapshot[];
  } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [dragging, setDragging] = useState(false);

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
  const playing = !staticMode && visible && pageVisible && !dragging;
  const requestedSpeed = Number.isFinite(speed) && speed > 0 ? speed : 50;
  const marqueeSpeed = reducedMotion ? Math.min(requestedSpeed, 24) : requestedSpeed;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!marquee.current || drag.current) return;

    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      vertical: false,
      pixelsPerSecond: marqueeSpeed,
      animations: getMarqueeAnimations(marquee.current),
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    const element = marquee.current;
    if (!currentDrag || !element || currentDrag.pointerId !== event.pointerId || currentDrag.vertical) return;

    const totalX = event.clientX - currentDrag.startX;
    const totalY = event.clientY - currentDrag.startY;
    if (!currentDrag.moved && Math.max(Math.abs(totalX), Math.abs(totalY)) < 5) return;
    if (!currentDrag.moved && Math.abs(totalY) > Math.abs(totalX)) {
      currentDrag.vertical = true;
      return;
    }

    currentDrag.moved = true;
    event.preventDefault();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const offsetInMs = (totalX / currentDrag.pixelsPerSecond) * 1000;
    for (const snapshot of currentDrag.animations) {
      // Seek the CSS loop itself, so its animation resumes from the dragged position.
      const nextTime = ((snapshot.currentTime - offsetInMs) % snapshot.duration + snapshot.duration)
        % snapshot.duration;
      snapshot.animation.currentTime = nextTime;
    }
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setDragging(false);
  }

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
          <div
            className={styles.frame}
            data-dragging={dragging}
            aria-hidden="true"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onLostPointerCapture={finishPointer}
          >
            <Marquee
              ref={marquee}
              className={styles.viewport}
              autoFill
              loop={0}
              play={playing}
              pauseOnHover={false}
              pauseOnClick={false}
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
