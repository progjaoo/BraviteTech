"use client";
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { processSteps } from '@/lib/brand';
export function Process(){
 const [active,setActive]=useState(0);const step=processSteps[active];
 const lanePositions=[70,250,430,610,790];const from=lanePositions[step.from],to=lanePositions[step.to];
 return <section className="process-section section-pad" id="processo"><div className="container">
  <div className="section-top" data-reveal><p className="eyebrow">02 / NOSSO PROCESSO</p><p className="section-aside">Método para transformar<br/>complexidade em clareza.</p></div>
  <div className="process-title" data-reveal><h2>Antes de construir,<br/><span>entender.</span></h2><p>Uma abordagem de análise de sistemas. Do contexto do negócio à entrega, cada etapa tem um objetivo e uma decisão compartilhada.</p></div>
  <div className="process-tabs" role="tablist" aria-label="Etapas do desenvolvimento">{processSteps.map((s,i)=><button role="tab" aria-selected={active===i} aria-controls="process-panel" id={`process-tab-${i}`} key={s.title} onClick={()=>setActive(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:4))%5;setActive(next);document.getElementById(`process-tab-${next}`)?.focus();}}} className={active===i?'active':''} tabIndex={active===i?0:-1}><span>0{i+1}</span>{s.title}</button>)}</div>
  <div className="process-panel" role="tabpanel" id="process-panel" aria-labelledby={`process-tab-${active}`}>
   <div className="process-copy"><AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}><span className="process-index">0{active+1} / 05</span><h3>{step.label}</h3><p>{step.description}</p><div className="process-output"><Check size={18}/><span>{step.output}</span></div></motion.div></AnimatePresence><div className="process-controls"><button className="icon-button" aria-label="Etapa anterior" onClick={()=>setActive((active+4)%5)}><ArrowLeft/></button><button className="icon-button" aria-label="Próxima etapa" onClick={()=>setActive((active+1)%5)}><ArrowRight/></button></div></div>
   <div className="sequence-wrap"><p className="eyebrow">DA CONVERSA À ENTREGA</p><svg className="sequence-diagram" viewBox="0 0 860 300" role="img" aria-label={`Diagrama da etapa ${step.label}: ${step.arrow}; ${step.returnArrow}`}>
    <defs><marker id="sequence-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2D6BFF"/></marker></defs>
    {['Você','Análise','Design','Engenharia','Qualidade'].map((lane,i)=><g key={lane}><rect x={lanePositions[i]-62} y="20" width="124" height="42" rx="3" fill={i===step.from||i===step.to?'#2D6BFF':'#0A0A0A'} stroke={i===step.from||i===step.to?'#2D6BFF':'#454B55'}/><text x={lanePositions[i]} y="46" textAnchor="middle" fill="#FFFFFF" fontSize="15">{lane}</text><line x1={lanePositions[i]} x2={lanePositions[i]} y1="72" y2="284" stroke="#454B55" strokeDasharray="4 6"/></g>)}
    <motion.g key={active} initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.25}}><rect x={from-5} y="104" width="10" height="112" fill="#2D6BFF"/><rect x={to-5} y="125" width="10" height="91" fill="#2D6BFF"/><line x1={from} x2={to} y1="126" y2="126" stroke="#2D6BFF" strokeWidth="2" markerEnd="url(#sequence-arrow)"/><text x={(from+to)/2} y="113" textAnchor="middle" fill="#FFFFFF" fontSize="13">{step.arrow}</text><line x1={to} x2={from} y1="209" y2="209" stroke="#2D6BFF" strokeDasharray="5 4" strokeWidth="2" markerEnd="url(#sequence-arrow)"/><text x={(from+to)/2} y="194" textAnchor="middle" fill="#FFFFFF" fontSize="13">{step.returnArrow}</text></motion.g>
   </svg><p className="sequence-note">Você participa das decisões. A tecnologia acompanha o objetivo.</p></div>
  </div>
 </div></section>;
}
