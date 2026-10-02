import type { Metadata } from 'next';
import type { CaseStudy } from '@bravite/shared';
import { content } from '@/lib/api';
import { CaseCard } from '@/components/cards';
import { AnalysisButton } from '@/components/providers';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Cases',description:'Conheça projetos da Bravite: objetivos, soluções construídas e entregas.'};
export default async function Cases(){const cases=await content<CaseStudy[]>('cases');return <><section className="page-hero container"><p className="eyebrow">CASES / CONSTRUÇÕES COM PROPÓSITO</p><h1>Objetivos claros.<br/><span>Soluções concretas.</span></h1><p className="page-hero-description">Projetos contados a partir do desafio, das decisões e da entrega.</p></section><section className="light-section section-pad"><div className="container">{cases.length?<div className="cases-grid">{cases.map((c,i)=><CaseCard key={c.id} project={c} index={i}/>)}</div>:<div className="case-page-empty"><span className="eyebrow">O PRÓXIMO CAPÍTULO</span><h2>O próximo projeto<br/>pode começar com você.</h2><p>Converse com a Bravite sobre seu objetivo e as possibilidades de uma solução digital.</p><AnalysisButton source="pagina-cases"/></div>}</div></section></>;}
