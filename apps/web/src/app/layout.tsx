import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Footer } from '@/components/footer';
import { SiteShell } from '@/components/site-shell';
import { brand } from '@/lib/brand';
import { SITE_URL } from '@/lib/seo';
import './globals.css';
export const metadata:Metadata={
 metadataBase:SITE_URL,
 referrer:'strict-origin',
 robots:process.env.VERCEL_ENV==='preview'?{index:false,follow:false}:{index:true,follow:true},
 title:{default:'Bravite — Coragem para criar. Engenharia para evoluir.',template:'%s | Bravite'},
 description:'Software house: sites, sistemas web, e-commerces, automação, inteligência artificial e análise de dados com visão de negócio.',
 openGraph:{title:'Bravite — Tecnologia construída com intenção',description:brand.slogan,url:SITE_URL.toString(),siteName:'Bravite',locale:'pt_BR',type:'website',images:[{url:'/brand/og.png',width:1200,height:630,alt:brand.slogan}]},
 twitter:{card:'summary_large_image',title:'Bravite — Tecnologia construída com intenção',description:brand.slogan,images:['/brand/og.png']},icons:{icon:[{url:'/favicon-google-32.png',sizes:'32x32',type:'image/png'},{url:'/favicon.ico'}],apple:'/apple-touch-icon-180.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers><SiteShell footer={<Footer/>}>{children}</SiteShell></Providers></body></html>;}
