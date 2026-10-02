import type { Metadata } from 'next';
import type { Post } from '@bravite/shared';
import { content } from '@/lib/api';
import { PostCard } from '@/components/cards';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Insights',description:'Perspectivas da Bravite sobre estratégia, desenvolvimento, design, automação e tecnologia para negócios.'};
export default async function Blog(){const posts=await content<Post[]>('posts');return <><section className="page-hero container"><p className="eyebrow">INSIGHTS / BRAVITE</p><h1>Ideias para pensar.<br/><span>Clareza para construir.</span></h1><p className="page-hero-description">Perspectivas sobre tecnologia, estratégia e o que vem antes da primeira linha de código.</p></section><section className="light-section section-pad"><div className="container"><div className="posts-grid blog-grid">{posts.map((p,i)=><PostCard key={p.id} post={p} index={i}/>)}</div>{!posts.length&&<p className="empty-message">Novas perspectivas serão compartilhadas por aqui.</p>}</div></section></>;}
