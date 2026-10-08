import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Instagram, Github, Linkedin, Facebook } from 'lucide-react';
import { brand, services } from '@/lib/brand';
import { AnalysisButton } from './providers';
import { CookiePreferencesButton } from './cookie-consent';
export function Footer(){return <footer className="site-footer"><div className="container">
 <div className="footer-callout"><p className="eyebrow">O PRÓXIMO PASSO COMEÇA AQUI</p><h2>O que vamos<br/><span>construir juntos?</span></h2><AnalysisButton className="button button-blue">Vamos conversar</AnalysisButton></div>
 <div className="footer-grid"><div className="footer-brand"><Link href="/" aria-label="Bravite — início"><Image src="/brand/logo-reverse.svg" alt="Bravite" width={760} height={110} style={{width:225,height:'auto'}}/></Link><p>{brand.slogan}</p><div className="footer-socials" aria-label="Redes sociais"><a href={brand.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Bravite — @bravite.br" title="Instagram — @bravite.br"><Instagram size={18} aria-hidden="true"/></a><a href="#" aria-label="GitHub" title="GitHub"><Github size={18} aria-hidden="true"/></a><a href="#" aria-label="LinkedIn" title="LinkedIn"><Linkedin size={18} aria-hidden="true"/></a><a href="#" aria-label="Facebook" title="Facebook"><Facebook size={18} aria-hidden="true"/></a></div></div>
 <div><h3>Explore</h3><Link href="/sobre">Sobre a Bravite</Link><Link href="/cases">Cases</Link><Link href="/blog">Insights</Link><Link href="/contato">Contato</Link></div>
 <div><h3>Soluções</h3>{services.map(s=><Link key={s.slug} href={`/servicos/${s.slug}`}>{s.title}</Link>)}</div>
 <div><h3>Vamos conversar</h3><a href={brand.whatsapp} target="_blank" rel="noopener noreferrer">{brand.phone}<ArrowUpRight size={15}/></a><a href={`mailto:${brand.email}`}>{brand.email}</a><span>Brasil · Projetos digitais</span></div></div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} Bravite. Todos os direitos reservados.</span><div><Link href="/politica-de-cookies">Cookies</Link><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/termos-de-uso">Termos de uso</Link><CookiePreferencesButton/></div><span className="footer-signature">CORAGEM + TECNOLOGIA + ENGENHARIA</span></div>
 </div></footer>;}
