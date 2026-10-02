"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { services } from '@/lib/brand';
import { AnalysisButton, useAnalysis } from './providers';
export function Header(){
 const [dropdown,setDropdown]=useState(false),[mobile,setMobile]=useState(false);
 const menu=useRef<HTMLDetailsElement>(null),mobileServices=useRef<HTMLDetailsElement>(null),mobileDialog=useRef<HTMLDialogElement>(null),path=usePathname();
 const analyze=useAnalysis();
 useEffect(()=>{setMobile(false);setDropdown(false);if(menu.current)menu.current.open=false;if(mobileServices.current)mobileServices.current.open=false;},[path]);
 useEffect(()=>{
  const close=(details:HTMLDetailsElement)=>{details.open=false;if(details===menu.current)setDropdown(false);};
  const outside=(event:Event)=>{
   for(const details of [menu.current,mobileServices.current])if(details?.open&&event.target instanceof Node&&!details.contains(event.target))close(details);
  };
  const escape=(event:KeyboardEvent)=>{
   const details=[mobileServices.current,menu.current].find(details=>details?.open);
   if(event.key==='Escape'&&details){event.preventDefault();close(details);details.querySelector('summary')?.focus();}
  };
  document.addEventListener('pointerdown',outside);
  document.addEventListener('focusin',outside);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('keydown',escape);};
 },[]);
 useEffect(()=>{if(mobile){mobileDialog.current?.showModal();}else{mobileDialog.current?.close();if(mobileServices.current)mobileServices.current.open=false;}},[mobile]);
 return <>
  <header className="site-header"><div className="header-inner">
   <Link href="/" className="brand-link" aria-label="Bravite — início"><Image src="/brand/logo-reverse.svg" alt="Bravite" width={760} height={110} style={{width:180,height:'auto'}} priority/></Link>
   <nav className="desktop-nav" aria-label="Navegação principal"><Link href="/sobre">Sobre</Link>
    <details className="services-dropdown" ref={menu} onToggle={e=>setDropdown(e.currentTarget.open)} onPointerEnter={event=>{if(event.pointerType==='mouse'&&window.matchMedia('(hover: hover) and (pointer: fine)').matches){event.currentTarget.open=true;setDropdown(true);}}} onPointerLeave={event=>{if(event.pointerType==='mouse'&&!event.currentTarget.contains(document.activeElement)){event.currentTarget.open=false;setDropdown(false);}}}><summary>Serviços<ChevronDown size={14} className={dropdown?'rotate':''}/></summary>
     <div className="dropdown-panel">{services.map(s=><Link key={s.slug} href={`/servicos/${s.slug}`} onClick={()=>{if(menu.current)menu.current.open=false;}}><span>{s.title}</span><ArrowUpRight size={16}/></Link>)}</div>
    </details><Link href="/cases">Cases</Link><Link href="/blog">Insights</Link><Link href="/contato">Contato</Link>
   </nav><div className="header-actions"><AnalysisButton className="button button-light header-cta">Receber análise gratuita</AnalysisButton><button className="icon-button mobile-toggle" aria-label="Abrir menu" onClick={()=>setMobile(true)}><Menu size={25}/></button></div>
  </div></header>
  <dialog ref={mobileDialog} className="mobile-dialog" onCancel={e=>{e.preventDefault();setMobile(false);}} aria-label="Menu de navegação">
   <div className="mobile-top"><Link href="/" onClick={()=>setMobile(false)}><Image src="/brand/logo-reverse.svg" alt="Bravite" width={760} height={110} style={{width:180,height:'auto'}}/></Link><button className="icon-button" onClick={()=>setMobile(false)} aria-label="Fechar menu"><X/></button></div>
   <AnimatePresence>{mobile&&<motion.nav aria-label="Navegação mobile" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mobile-nav"><Link href="/sobre" onClick={()=>setMobile(false)}>Sobre a Bravite</Link><details ref={mobileServices}><summary>Serviços<ChevronDown/></summary>{services.map(s=><Link className="mobile-service" key={s.slug} href={`/servicos/${s.slug}`}>{s.title}</Link>)}</details><Link href="/cases">Cases</Link><Link href="/blog">Insights</Link><Link href="/contato">Contato</Link><button className="button button-blue" onClick={()=>{setMobile(false);analyze('menu');}}>Receber análise gratuita<ArrowUpRight size={18}/></button></motion.nav>}</AnimatePresence>
  </dialog>
 </>;
}
