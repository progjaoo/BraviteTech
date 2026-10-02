"use client";

import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import gsap from 'gsap';
import { technologies } from '@/lib/technologies';

export function TechnologyMarquee() {
 const [paused,setPaused]=useState(false);
 const reduced=usePrefersReducedMotion();
 const root=useRef<HTMLElement>(null),track=useRef<HTMLDivElement>(null);
 const update=useRef<(()=>void)|null>(null),pausedRef=useRef(paused);
 useEffect(()=>{pausedRef.current=paused;update.current?.();},[paused]);
 useLayoutEffect(()=>{
  const element=root.current,row=track.current,group=row?.firstElementChild;
  if(!element||!row||!group)return;
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   let tween:gsap.core.Tween|undefined,visible=true,active=true;
   function activity(){
    if(!active)return;
    const held=pausedRef.current||element!.matches(':hover, :focus-within')||!visible||document.hidden;
    tween?.paused(held);element!.dataset.motion=held?'paused':'running';
   }
   function measure(){
    const progress=tween?.progress()||0;
    tween?.kill();const width=group!.getBoundingClientRect().width;
    tween=gsap.fromTo(row,{x:0},{x:-width,duration:width/46,repeat:-1,ease:'none'}).progress(progress);
    activity();
   }
   // Read the browser's current state after focus/pointer dispatch, rather than
   // retaining flags that can outlive a focused button or a DOM update.
   const interaction=()=>queueMicrotask(activity);
   const observer=new ResizeObserver(measure);observer.observe(group);
   const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;activity();});intersection.observe(element);
   element.addEventListener('pointerenter',interaction);element.addEventListener('pointerleave',interaction);
   element.addEventListener('focusin',interaction);element.addEventListener('focusout',interaction);
   document.addEventListener('visibilitychange',activity);element.dataset.animated='true';update.current=activity;measure();
   return ()=>{
    active=false;
    observer.disconnect();intersection.disconnect();tween?.revert();update.current=null;delete element.dataset.animated;delete element.dataset.motion;
    element.removeEventListener('pointerenter',interaction);element.removeEventListener('pointerleave',interaction);
    element.removeEventListener('focusin',interaction);element.removeEventListener('focusout',interaction);document.removeEventListener('visibilitychange',activity);
   };
  });
  return ()=>media.revert();
 },[]);
 return <section className="tech-strip" ref={root} aria-label="Tecnologias do nosso desenvolvimento">
  <div className="container tech-marquee-heading"><span>ENGENHARIA PARA EVOLUIR</span><div className="tech-marquee-actions"><Link href="/sobre#tecnologia">Tecnologia com critério<ArrowRight size={15}/></Link><button className="icon-button" disabled={!!reduced} aria-label={reduced?'Movimento reduzido ativado':paused?'Retomar carrossel de tecnologias':'Pausar carrossel de tecnologias'} aria-pressed={paused||!!reduced} onClick={()=>setPaused(value=>!value)}>{paused||reduced?<Play size={16}/>:<Pause size={16}/>}</button></div></div>
  <div className="tech-marquee"><div className="tech-marquee-track" ref={track}><ul className="tech-marquee-group">{technologies.map(name=><li key={name}><span className="blue-dot" aria-hidden="true"/>{name}</li>)}</ul><ul className="tech-marquee-group tech-marquee-copy" aria-hidden="true">{technologies.map(name=><li key={name}><span className="blue-dot"/>{name}</li>)}</ul></div></div>
 </section>;
}
