"use client";

import { useLayoutEffect, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { scrollToTopEvent } from '@/lib/scroll-navigation';
import { isPrivateAdminPath } from '@/lib/admin-path';

export function ScrollEffects() {
 const path=usePathname();
 const lastPath=useRef(path),historyNavigation=useRef(false);
 useEffect(()=>{
  const history=()=>{historyNavigation.current=window.location.pathname!==lastPath.current;};
  window.addEventListener('popstate',history);
  return ()=>window.removeEventListener('popstate',history);
 },[]);
 useLayoutEffect(()=>{
  const changed=lastPath.current!==path;lastPath.current=path;
  if(changed&&!historyNavigation.current){
   // The persistent main shell can make Next consider the new page visible.
   // Restore the new page's start, while honoring cross-page hash links.
   let target:HTMLElement|null=null;
   try{target=window.location.hash?document.getElementById(decodeURIComponent(window.location.hash.slice(1))):null;}catch{}
   window.scrollTo({top:target?target.getBoundingClientRect().top+window.scrollY-110:0,behavior:'instant'});
  }
  historyNavigation.current=false;
  if(isPrivateAdminPath(path))return;
  gsap.registerPlugin(ScrollTrigger,SplitText);
  const media=gsap.matchMedia();
  const splits:SplitText[]=[];
  let activeLenis:Lenis|null=null;
  const toTop=(event:Event)=>{
   event.preventDefault();
   if(activeLenis)activeLenis.scrollTo(0,{duration:.85,force:true});
   else window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  window.addEventListener(scrollToTopEvent,toTop);
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   document.querySelectorAll<HTMLElement>('main [data-reveal]').forEach(element=>{
    const words=element.dataset.reveal==='words';
    if(element.matches('h2,h3')) {
     const split=SplitText.create(element,{type:words?'lines,words':'lines',mask:words?undefined:'lines',autoSplit:true,aria:'auto',onSplit(self){
      if(words)return gsap.fromTo(self.words,{opacity:.36},{opacity:1,stagger:.08,ease:'none',scrollTrigger:{trigger:element,start:'top 85%',end:'bottom 48%',scrub:.7}});
      if(element.getBoundingClientRect().top<window.innerHeight*.75)return;
      return gsap.from(self.lines,{yPercent:105,autoAlpha:0,duration:1.1,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 88%',once:true}});
     }});
     splits.push(split);return;
    }
    if(element.getBoundingClientRect().top<window.innerHeight*.75)return;
    const siblings=Array.from(element.parentElement?.children||[]).filter(el=>el.hasAttribute('data-reveal'));
    gsap.from(element,{y:32,autoAlpha:0,duration:1.05,delay:Math.min(siblings.indexOf(element)*.07,.28),ease:'power3.out',scrollTrigger:{trigger:element,start:'top 90%',once:true}});
   });
   return ()=>{splits.forEach(split=>split.revert());splits.length=0;};
  });
  media.add('(prefers-reduced-motion: no-preference) and (pointer: fine)',()=>{
   const lenis=new Lenis({autoRaf:false,duration:1.1,smoothWheel:true,stopInertiaOnNavigate:true,anchors:{offset:-110},prevent:()=>!!document.querySelector('dialog[open]')});
   activeLenis=lenis;
   const tick=(time:number)=>lenis.raf(time*1000);
   lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(tick);
   return ()=>{gsap.ticker.remove(tick);lenis.off('scroll',ScrollTrigger.update);lenis.destroy();if(activeLenis===lenis)activeLenis=null;};
  });
  const refresh=()=>ScrollTrigger.refresh();
  let active=true;
  void document.fonts.ready.then(()=>{if(active)refresh();});
  return ()=>{active=false;window.removeEventListener(scrollToTopEvent,toTop);media.revert();};
 },[path]);
 return null;
}
