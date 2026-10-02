import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api']},sitemap:`${process.env.NEXT_PUBLIC_SITE_URL||'https://www.bravite.com.br'}/sitemap.xml`};}
