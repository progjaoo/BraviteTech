"use client";
import { useLayoutEffect, useRef } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { AnalysisButton } from './providers';
import { brand } from '@/lib/brand';
export function Hero(){
 const root=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{
  const ctx=gsap.context(()=>{
   const mm=gsap.matchMedia();
   mm.add('(prefers-reduced-motion: no-preference)',()=>{
    // AURA's masked typography timeline, converted from Svelte onMount to React context.
    const tl=gsap.timeline({delay:.15});
    tl.from('.hero-word',{yPercent:105,rotateZ:1.5,duration:1.25,stagger:.12,ease:'expo.out'})
      .from('.hero-intro,.hero-actions,.hero-meta',{y:20,autoAlpha:0,duration:.7,stagger:.1,ease:'power3.out'},'-=.7')
      .from('.hero-field',{autoAlpha:0,scale:1.05,duration:1.8,ease:'power2.out'},0);
    gsap.to('.orbital-lines',{rotation:12,transformOrigin:'50% 50%',duration:24,repeat:-1,yoyo:true,ease:'sine.inOut'});
   });
  },root);return ()=>ctx.revert();
 },[]);
 return <section className="hero" ref={root} aria-labelledby="hero-heading">
  <div className="hero-field" aria-hidden="true"><svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="field-fade"><stop offset="0" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient><mask id="field-mask"><rect width="1400" height="900" fill="url(#field-fade)"/></mask></defs><g className="orbital-lines" mask="url(#field-mask)">{Array.from({length:32},(_,i)=><ellipse key={i} cx="700" cy="465" rx={75+i*23} ry={50+i*17} fill="none" stroke={i%5===0?'#2D6BFF':'#FFFFFF'} strokeOpacity={i%5===0?.22:.055} strokeWidth="1" transform="rotate(-22 700 465)"/>)}</g><path d="M0 660L1400 130 M0 730L1400 200 M0 800L1400 270" stroke="#2D6BFF" strokeOpacity=".07"/></svg></div>
  <div className="hero-content container"><p className="eyebrow hero-intro"><span className="blue-dot"/>SOFTWARE HOUSE · BRAVITE</p>
   <h1 id="hero-heading"><span className="word-mask"><span className="hero-word">Coragem para criar.</span></span><span className="word-mask"><span className="hero-word hero-accent">Engenharia para evoluir.</span></span></h1>
   <p className="hero-description hero-intro">Transformamos desafios de negócio em experiências digitais,<br className="desktop-break"/> sistemas e soluções construídas com intenção.</p>
   <div className="hero-actions"><AnalysisButton source="hero"/><a href={brand.whatsapp} className="button button-outline" target="_blank" rel="noopener noreferrer">Conversar no WhatsApp<ArrowUpRight size={18}/></a></div>
  </div>
  <div className="hero-meta container"><span>ESTRATÉGIA. DESIGN. DESENVOLVIMENTO.</span><a href="#solucoes">Explore as possibilidades<ArrowDownRight size={18}/></a><span className="hero-coordinate">BRAVE + IT + ENGINEER</span></div>
 </section>;
}
