"use client";
import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import gsap from 'gsap';
import { AnalysisButton } from './providers';
import { brand } from '@/lib/brand';
import { HeroGalaxy } from './hero-galaxy';
export function Hero(){
 const root=useRef<HTMLElement>(null);
 const [paused,setPaused]=useState(false);
 const reduced=usePrefersReducedMotion();
 useLayoutEffect(()=>{
  const ctx=gsap.context(()=>{
   const mm=gsap.matchMedia();
   mm.add('(prefers-reduced-motion: no-preference)',()=>{
    // AURA's masked typography timeline, converted from Svelte onMount to React context.
    const tl=gsap.timeline({delay:.15});
    tl.from('.hero-word',{yPercent:105,rotateZ:1.5,duration:1.25,stagger:.12,ease:'expo.out'})
      .from('.hero-intro,.hero-actions,.hero-meta',{y:20,autoAlpha:0,duration:.7,stagger:.1,ease:'power3.out'},'-=.7')
      .from('.hero-field',{autoAlpha:0,scale:1.05,duration:1.8,ease:'power2.out'},0);
   });
  },root);return ()=>ctx.revert();
 },[]);
 return <section className="hero" ref={root} aria-labelledby="hero-heading">
  <div className="hero-field" aria-hidden="true"><HeroGalaxy paused={paused}/></div>
  <div className="hero-content container"><p className="eyebrow hero-intro"><span className="blue-dot"/>SOFTWARE HOUSE · BRAVITE</p>
   <h1 id="hero-heading"><span className="word-mask"><span className="hero-word">Coragem para criar.</span></span><span className="word-mask"><span className="hero-word hero-accent">Engenharia para evoluir.</span></span></h1>
   <p className="hero-description hero-intro">Transformamos desafios de negócio em experiências digitais,<br className="desktop-break"/> sistemas e soluções construídas com intenção.</p>
   <div className="hero-actions"><AnalysisButton source="hero"/><a href={brand.whatsapp} className="button button-outline" target="_blank" rel="noopener noreferrer">Conversar no WhatsApp<ArrowUpRight size={18}/></a></div>
  </div>
  <div className="hero-meta container"><span>ESTRATÉGIA. DESIGN. DESENVOLVIMENTO.</span><a href="#solucoes">Explore as possibilidades<ArrowDownRight size={18}/></a><div className="hero-motion-controls"><span className="hero-coordinate">BRAVE + IT + ENGINEER</span><button className="icon-button" disabled={!!reduced} aria-label={reduced?'Movimento reduzido ativado':paused?'Retomar animação do fundo':'Pausar animação do fundo'} aria-pressed={paused||!!reduced} onClick={()=>setPaused(value=>!value)}>{paused||reduced?<Play size={16}/>:<Pause size={16}/>}</button></div></div>
 </section>;
}
