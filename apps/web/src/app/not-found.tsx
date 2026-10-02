import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function NotFound(){return <section className="page-hero container not-found"><p className="eyebrow">404 / NOVO CAMINHO</p><h1>Esta página<br/><span>não está por aqui.</span></h1><p>Volte ao início e encontre as possibilidades da Bravite.</p><Link href="/" className="button button-blue">Ir para o início<ArrowUpRight size={18}/></Link></section>;}
