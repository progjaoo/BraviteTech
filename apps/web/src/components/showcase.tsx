"use client";
import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { ProductVisual } from './visuals';
const cards=[{title:'Experiências que\naproximam.',label:'SITES & PRESENÇA DIGITAL',slug:'criacao-de-sites'},{title:'Sistemas que\nconectam.',label:'PLATAFORMAS & OPERAÇÃO',slug:'sistemas-web'},{title:'Ideias que\nganham escala.',label:'AUTOMAÇÃO & INTELIGÊNCIA ARTIFICIAL',slug:'automacao-inteligencia-artificial'}];
export function Showcase(){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const ctx=gsap.context(()=>{
   const mm=gsap.matchMedia();mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)',()=>{
    gsap.utils.toArray<HTMLElement>('.showcase-card').forEach((card,i)=>{gsap.from(card,{y:70,autoAlpha:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:root.current,start:`top ${85-i*6}%`,once:true}});});
   });
  },root);return ()=>ctx.revert();
 },[]);
 return <div className="showcase-grid" ref={root}>{cards.map((c,i)=><Link href={`/servicos/${c.slug}`} className={`showcase-card showcase-${i}`} key={c.slug}><div className="showcase-top"><span>0{i+1}</span><ArrowUpRight size={24}/></div><ProductVisual variant={i}/><div className="showcase-copy"><p className="eyebrow">{c.label}</p><h3>{c.title.split('\n').map((l,j)=><span key={j}>{l}<br/></span>)}</h3></div></Link>)}</div>;
}
