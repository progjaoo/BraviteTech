import type { Metadata } from 'next';
import { cache } from 'react';
import type { CaseStudy } from '@bravite/shared';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowUpRight } from 'lucide-react';
import { content } from '@/lib/api';
import { absoluteSiteUrl, createPageMetadata, serializeJsonLd, socialImageUrl } from '@/lib/seo';
export const dynamic='force-dynamic';
const find=cache(async (slug:string)=>{try{return await content<CaseStudy>(`cases/${slug}`);}catch(e){if((e as {status?:number}).status===404)notFound();throw e;}});
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=await find(slug);return createPageMetadata({title:c.title,description:c.summary,path:`/cases/${c.slug}`,image:c.cover_url,imageAlt:c.cover_alt});}
export default async function Case({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=await find(slug);const project={'@context':'https://schema.org','@type':'CreativeWork',name:c.title,description:c.summary,image:[socialImageUrl(c.cover_url)],creator:{'@type':'Organization',name:'Bravite',url:absoluteSiteUrl('/')},mainEntityOfPage:absoluteSiteUrl(`/cases/${c.slug}`),inLanguage:'pt-BR'};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(project)}}/><section className="page-hero container"><p className="eyebrow">CASE / {c.category}</p><h1>{c.title}</h1><p className="page-hero-description">{c.summary}</p><div className="case-byline"><span>{c.client}</span>{c.website_url&&<a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-link">Visitar projeto<ArrowUpRight size={16}/></a>}</div></section><article className="light-section">{c.cover_url&&<div className="container article-cover"><Image src={c.cover_url} alt={c.cover_alt} width={1200} height={630} sizes="100vw"/></div>}<div className="prose container article-content"><ReactMarkdown>{c.content}</ReactMarkdown></div></article></>;}
