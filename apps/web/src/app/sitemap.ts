import type { MetadataRoute } from 'next';
import type { Post,CaseStudy } from '@bravite/shared';
import { services } from '@/lib/brand';
import { content } from '@/lib/api';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL||'https://www.bravite.com.br';const [posts,cases]=await Promise.all([content<Post[]>('posts'),content<CaseStudy[]>('cases')]);return ['','/sobre','/contato','/cases','/blog','/politica-de-privacidade','/termos-de-uso',...services.map(s=>`/servicos/${s.slug}`),...posts.map(p=>`/blog/${p.slug}`),...cases.map(c=>`/cases/${c.slug}`)].map(path=>({url:base+path}));}
