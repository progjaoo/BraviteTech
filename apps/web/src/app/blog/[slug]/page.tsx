import type { Metadata } from 'next';
import type { Post } from '@bravite/shared';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { content } from '@/lib/api';
import { ArticleVisual } from '@/components/visuals';
export const dynamic='force-dynamic';
async function find(slug:string){try{return await content<Post>(`posts/${slug}`);}catch(e){if((e as {status?:number}).status===404)notFound();throw e;}}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const p=await find((await params).slug);return {title:p.title,description:p.excerpt};}
export default async function Article({params}:{params:Promise<{slug:string}>}){const p=await find((await params).slug);return <><section className="page-hero container article-hero"><Link href="/blog" className="text-link"><ArrowLeft size={16}/>Todas as perspectivas</Link><p className="eyebrow">{p.category}</p><h1>{p.title}</h1><p className="page-hero-description">{p.excerpt}</p><span className="article-byline">Por Bravite · {new Date(p.published_at||p.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</span></section><article className="light-section"><div className="container article-cover">{p.cover_url?<Image src={p.cover_url} alt={p.cover_alt} width={1200} height={630} sizes="100vw"/>:<ArticleVisual/>}</div><div className="prose container article-content"><ReactMarkdown>{p.content}</ReactMarkdown></div></article></>;}
