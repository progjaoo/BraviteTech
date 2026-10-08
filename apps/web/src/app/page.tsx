import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Globe, Layers, ShoppingBag, Sparkles, Target, ChartNoAxesCombined, Check } from 'lucide-react';
import type { Post,CaseStudy } from '@bravite/shared';
import { content } from '@/lib/api';
import { brand,services } from '@/lib/brand';
import { Hero } from '@/components/hero';
import { Showcase } from '@/components/showcase';
import { Process } from '@/components/process';
import { AnalysisButton } from '@/components/providers';
import { PostCard } from '@/components/cards';
import { CaseCarousel } from '@/components/case-carousel';
import { Faq } from '@/components/faq';
import { TechnologyMarquee } from '@/components/technology-marquee';
export const dynamic='force-dynamic';
const icons=[Globe,Layers,ShoppingBag,Sparkles,Target,ChartNoAxesCombined];
export default async function Home(){
 const [posts,cases]=await Promise.all([content<Post[]>('posts'),content<CaseStudy[]>('cases')]);
 const org={'@context':'https://schema.org','@type':'Organization',name:'Bravite',url:'https://www.bravite.com.br',logo:'https://www.bravite.com.br/brand/logo-primary.svg',email:brand.email,telephone:'+5524999119722',sameAs:[brand.instagram]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(org).replace(/</g,'\\u003c')}}/><Hero/>
  <section className="manifesto-section section-pad"><div className="container"><div className="section-top" data-reveal><p className="eyebrow">TECNOLOGIA COM INTENÇÃO</p><span className="small-label">BRAVE + IT + E</span></div><div className="manifesto-grid"><h2 data-reveal="words">Não começamos<br/>pela ferramenta.<br/><span>Começamos por você.</span></h2><div className="manifesto-copy" data-reveal><p>Uma boa solução digital entende o negócio antes de escrever a primeira linha de código.</p><p className="muted">Da análise à entrega, conectamos estratégia, identidade e engenharia para construir o que seu projeto precisa.</p><Link className="text-link" href="/sobre">Conheça a Bravite<ArrowUpRight size={18}/></Link></div></div><Showcase/></div></section>
  <section id="solucoes" className="services-section section-pad"><div className="container"><div className="section-top" data-reveal><p className="eyebrow">01 / O QUE CONSTRUÍMOS</p><p className="section-aside">Seis caminhos.<br/>Um objetivo: o seu negócio.</p></div><div className="services-layout"><div className="services-intro" data-reveal><h2>A solução certa<br/>para o seu<br/><span>próximo passo.</span></h2><p>Presença, operação, vendas e informação. Escolhemos o caminho com base no que precisa acontecer.</p><AnalysisButton className="text-link" source="servicos">Vamos descobrir juntos</AnalysisButton></div><div className="services-list">{services.map((s,i)=>{const Icon=icons[i];return <Link key={s.slug} href={`/servicos/${s.slug}`} className="service-row" data-reveal><span className="service-number">{s.number}</span><div><h3>{s.title}</h3><p>{s.short}</p></div><span className="service-row-icon"><Icon size={23} strokeWidth={1.4}/><ArrowUpRight size={23}/></span></Link>;})}</div></div></div></section>
  <TechnologyMarquee/>
  <Process/>
  <section className="analysis-section section-pad"><div className="container analysis-layout"><div data-reveal><p className="eyebrow">UMA CONVERSA, NOVAS POSSIBILIDADES</p><h2>Sua ideia merece<br/><span>um bom começo.</span></h2><p>Você não precisa chegar com todas as respostas. Conte seu desafio e receba uma análise inicial sobre os próximos passos.</p></div><div className="analysis-card" data-reveal><div className="analysis-card-top"><span className="eyebrow">ANÁLISE GRATUITA</span><ArrowUpRight size={29}/></div><h3>Qual problema<br/>precisa ser resolvido?</h3><ul><li><Check size={17}/>Entender seu momento e objetivo</li><li><Check size={17}/>Identificar possibilidades digitais</li><li><Check size={17}/>Orientar o próximo passo</li></ul><AnalysisButton className="button button-blue full-width" source="card-analise">Preencher formulário</AnalysisButton><a className="analysis-whatsapp" href={brand.whatsapp} target="_blank" rel="noopener noreferrer">Prefere conversar? WhatsApp<ArrowUpRight size={15}/></a></div></div></section>
  <section className="cases-section section-pad"><div className="container"><div className="section-top" data-reveal><p className="eyebrow">03 / CONSTRUÇÕES COM PROPÓSITO</p><Link href="/cases" className="text-link">Explorar cases<ArrowUpRight size={17}/></Link></div><h2 data-reveal>Ideias que saem do papel.<br/><span>Trabalho que faz sentido.</span></h2>{cases.length?<CaseCarousel cases={cases}/>:<div className="cases-empty" data-reveal><div className="empty-brand" aria-hidden="true"><Image src="/brand/symbol.svg" width={146} height={110} alt=""/></div><div><p className="eyebrow">O PRÓXIMO CAPÍTULO</p><h3>Vamos construir algo<br/>que valha mostrar.</h3><p>Converse com a Bravite sobre o que você quer transformar.</p><AnalysisButton className="text-link" source="cases">Começar uma conversa</AnalysisButton></div></div>}</div></section>
  <section className="insights-section section-pad"><div className="container"><div className="section-top" data-reveal><p className="eyebrow">04 / PERSPECTIVAS</p><Link className="text-link" href="/blog">Todos os insights<ArrowUpRight size={18}/></Link></div><h2 data-reveal>Antes de escolher a tecnologia,<br/><span>amplie a perspectiva.</span></h2><div className="posts-grid">{posts.slice(0,3).map((p,i)=><PostCard key={p.id} post={p} index={i}/>)}</div></div></section>
  <Faq/>
 </>;
}
