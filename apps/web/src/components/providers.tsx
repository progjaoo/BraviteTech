"use client";
import { createContext, useContext, useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, X, Check, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { ScrollEffects } from './scroll-effects';
import { WhatsAppInput } from './whatsapp-input';
import { brand, services } from '@/lib/brand';
import { request } from '@/lib/api';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

const AnalysisContext=createContext<(source?:string)=>void>(()=>{});
export const useAnalysis=()=>useContext(AnalysisContext);
export function AnalysisButton({children="Receber análise gratuita",className="button button-blue",source="site"}:{children?:ReactNode;className?:string;source?:string}){
 const open=useAnalysis();return <button className={className} onClick={()=>open(source)}>{children}<ArrowUpRight size={18} aria-hidden="true"/></button>;
}
export function Providers({children}:{children:ReactNode}){
 const reduced=usePrefersReducedMotion();
 const [open,setOpen]=useState(false),[source,setSource]=useState('site'),[intent,setIntent]=useState<{id:string;token:string}|null>(null);
 const [state,setState]=useState<'idle'|'sending'|'success'>('idle'),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const submitting=useRef(false);
 const intentRequest=useRef(0);
 const begin=(nextSource='site')=>{
  setSource(nextSource);setOpen(true);setState('idle');setError('');
  // Clicks are anonymous intent records; personal data arrives only with consent.
  const sequence=++intentRequest.current;
  setIntent(null);void request<{id:string;token:string}>('leads/intent',{method:'POST',body:JSON.stringify({source:nextSource})}).then(value=>{if(sequence===intentRequest.current)setIntent(value);}).catch(()=>{});
 };
 useEffect(()=>{
  if(open){dialog.current?.showModal();document.body.style.overflow='hidden';}
  else{dialog.current?.close();document.body.style.overflow='';}
  return ()=>{document.body.style.overflow='';};
 },[open]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(submitting.current)return;
  submitting.current=true;setState('sending');setError('');
  const fields=new FormData(event.currentTarget);
  const data={name:fields.get('name'),email:fields.get('email'),phone:fields.get('phone'),company:fields.get('company'),service:fields.get('service'),message:fields.get('message'),website:fields.get('website')};
  try{
   await request('leads',{method:'POST',body:JSON.stringify({...data,consent:fields.get('consent')==='on',...(intent?{intentId:intent.id,intentToken:intent.token}:{})})});
   setState('success');intentRequest.current++;setIntent(null);
  }catch(e){setState('idle');setError(e instanceof Error?e.message:'Tente novamente em instantes.');}
  finally{submitting.current=false;}
 }
 return <MotionConfig reducedMotion={reduced?'always':'never'}><AnalysisContext.Provider value={begin}>{children}<ScrollEffects/>
  <dialog ref={dialog} className="analysis-dialog" onCancel={e=>{e.preventDefault();if(state!=='sending')setOpen(false);}} onClick={e=>{if(e.target===dialog.current&&state!=='sending')setOpen(false);}} aria-labelledby="analysis-title">
   <AnimatePresence>{open&&<motion.div className="dialog-content" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}>
    <button className="icon-button dialog-close" onClick={()=>setOpen(false)} disabled={state==='sending'} aria-label="Fechar formulário"><X size={22}/></button>
    {state==='success'?<div className="success-panel"><span className="success-icon"><Check size={32}/></span><p className="eyebrow">PRÓXIMO PASSO</p><h2 id="analysis-title">Sua ideia já tem<br/>um ponto de partida.</h2><p>Recebemos seu pedido de análise. A Bravite usará os contatos informados para conversar sobre o seu projeto.</p><a className="button button-blue" href={brand.whatsapp} target="_blank" rel="noopener noreferrer">Conversar no WhatsApp<ArrowUpRight size={18}/></a></div>:<>
     <p className="eyebrow">VAMOS ENTENDER SEU NEGÓCIO</p><h2 id="analysis-title">Uma boa solução<br/>começa com uma conversa.</h2>
     <p className="dialog-description">Você visitou nossa página. Se ainda há interesse, preencha o formulário para receber sua análise gratuita.</p>
     <form onSubmit={submit} className="analysis-form">
      <div className="form-grid"><label>Seu nome<input name="name" autoComplete="name" required minLength={2} maxLength={120} placeholder="Como podemos chamar você?"/></label><label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@empresa.com.br"/></label></div>
      <div className="form-grid"><label>WhatsApp<WhatsAppInput/></label><label><span>Empresa <span className="optional">(opcional)</span></span><input name="company" autoComplete="organization" maxLength={160} placeholder="Nome da sua empresa"/></label></div>
      <label>O que você tem em mente?<select name="service" defaultValue={services.find(s=>s.slug===source)?.title||''} required><option value="" disabled>Selecione uma possibilidade</option>{services.map(s=><option key={s.slug}>{s.title}</option>)}<option>Ainda preciso entender a melhor solução</option></select></label>
      <label>Conte um pouco sobre seu desafio<textarea name="message" rows={3} required minLength={10} maxLength={3000} placeholder="O que você quer construir ou melhorar no seu negócio?"/></label>
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className="consent"><input name="consent" type="checkbox" required/><span>Li a <Link href="/politica-de-privacidade" target="_blank">Política de Privacidade</Link> e autorizo o contato da Bravite sobre esta solicitação.</span></label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="button button-blue full-width" type="submit" disabled={state==='sending'}>{state==='sending'?<>Enviando<LoaderCircle className="spin" size={18}/></>:<>Pedir minha análise gratuita<ArrowUpRight size={18}/></>}</button><p className="form-note">Avaliação inicial gratuita. Sem compromisso de contratação.</p>
     </form></>}
   </motion.div>}</AnimatePresence>
  </dialog>
 </AnalysisContext.Provider></MotionConfig>;
}
