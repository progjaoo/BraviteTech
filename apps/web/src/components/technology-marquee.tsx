"use client";

import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Pause, Play } from 'lucide-react';
import gsap from 'gsap';
import { technologies } from '@/lib/technologies';

export function TechnologyMarquee() {
 const [paused,setPaused]=useState(false),[copies,setCopies]=useState(2);
 const root=useRef<HTMLElement>(null),track=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null);
 const update=useRef<(()=>void)|null>(null),pausedRef=useRef(paused);
 useEffect(()=>{pausedRef.current=paused;update.current?.();},[paused]);

 useLayoutEffect(()=>{
  const element=root.current,row=track.current,windowElement=viewport.current,group=row?.firstElementChild;
  if(!element||!row||!windowElement||!group)return;
  let tween:gsap.core.Tween|undefined,visible=true,active=true;
  function activity(){
   if(!active)return;
   const held=pausedRef.current||!visible||document.hidden;
   tween?.paused(held);element!.dataset.motion=held?'paused':'running';
  }
  function measure(){
   if(!active)return;
   const width=group!.getBoundingClientRect().width;
   if(!width)return;
   // A full extra group always covers the viewport at the loop boundary, even on ultrawide screens.
   const count=Math.max(2,Math.ceil(windowElement!.clientWidth/width)+1);
   setCopies(current=>current===count?current:count);
   const progress=tween?.progress()??0;
   tween?.kill();
   tween=gsap.fromTo(row,{x:0},{x:-width,duration:width/(windowElement!.clientWidth<760?46:60),repeat:-1,ease:'none'}).progress(progress);
   element!.dataset.animated='true';activity();
  }
  const dimensions=new ResizeObserver(measure);
  dimensions.observe(group);dimensions.observe(windowElement);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;activity();});intersection.observe(element);
  document.addEventListener('visibilitychange',activity);
  update.current=activity;measure();
  return ()=>{
   active=false;dimensions.disconnect();intersection.disconnect();tween?.revert();update.current=null;
   delete element.dataset.animated;delete element.dataset.motion;
   document.removeEventListener('visibilitychange',activity);
  };
 },[]);

 return <section id="tecnologias" className="tech-strip" ref={root} aria-label="Tecnologias do nosso desenvolvimento">
  <div className="container tech-marquee-heading"><span>ENGENHARIA PARA EVOLUIR</span><div className="tech-marquee-actions"><Link href="/sobre#tecnologia">Tecnologia com critério<ArrowRight size={15}/></Link><button className="icon-button" aria-label={paused?'Retomar carrossel de tecnologias':'Pausar carrossel de tecnologias'} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button></div></div>
  <div className="tech-marquee" ref={viewport}><div className="tech-marquee-track" ref={track}>{Array.from({length:copies},(_,copy)=><ul key={copy} className={`tech-marquee-group${copy?' tech-marquee-copy':''}`} aria-hidden={copy?true:undefined}>{technologies.map(name=><li key={name}><span className="blue-dot" aria-hidden="true"/>{name}</li>)}</ul>)}</div></div>
 </section>;
}
