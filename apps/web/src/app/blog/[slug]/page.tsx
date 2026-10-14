import type { Metadata } from 'next';
import { cache } from 'react';
import type { Post } from '@bravite/shared';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { content } from '@/lib/api';
import { ArticleVisual } from '@/components/visuals';
import { absoluteSiteUrl, createPageMetadata, serializeJsonLd, socialImageUrl, validIsoDate } from '@/lib/seo';
import { AnalysisButton } from '@/components/providers';
export const dynamic='force-dynamic';
const find=cache(async (slug:string)=>{try{return await content<Post>(`posts/${slug}`);}catch(e){if((e as {status?:number}).status===404)notFound();throw e;}});
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=await find(slug);return createPageMetadata({title:p.title,description:p.excerpt,path:`/blog/${p.slug}`,image:p.cover_url,imageAlt:p.cover_alt,type:'article',publishedTime:validIsoDate(p.published_at||p.created_at)});}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await find(slug);const publishedTime=validIsoDate(p.published_at||p.created_at);const article={'@context':'https://schema.org','@type':'Article',headline:p.title,description:p.excerpt,image:[socialImageUrl(p.cover_url)],datePublished:publishedTime,author:{'@type':'Organization',name:'Bravite',url:absoluteSiteUrl('/')},publisher:{'@type':'Organization',name:'Bravite',url:absoluteSiteUrl('/')},mainEntityOfPage:absoluteSiteUrl(`/blog/${p.slug}`),inLanguage:'pt-BR'};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(article)}}/><section className="page-hero container article-hero"><Link href="/blog" className="text-link"><ArrowLeft size={16}/>Todas as perspectivas</Link><p className="eyebrow">{p.category}</p><h1>{p.title}</h1><p className="page-hero-description">{p.excerpt}</p><span className="article-byline">Por Bravite · {new Date(p.published_at||p.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</span></section><article className="light-section"><div className="container article-cover">{p.cover_url?<Image src={p.cover_url} alt={p.cover_alt} width={1200} height={630} sizes="100vw"/>:<ArticleVisual/>}</div><div className="prose container article-content"><ReactMarkdown>{p.content}</ReactMarkdown><div className="article-cta"><AnalysisButton className="text-link" source="blog-end">Receber análise gratuita</AnalysisButton><a className="text-link" href="/materiais/checklist-site.pdf" target="_blank" rel="noopener noreferrer">Baixar checklist para planejar seu site</a></div></div></article></>;}
