"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="page-hero container not-found"><p className="eyebrow">VAMOS TENTAR NOVAMENTE</p><h1>Não conseguimos<br/><span>carregar esta página.</span></h1><p>Recarregue a página ou fale com a Bravite pelo WhatsApp.</p><button className="button button-blue" onClick={reset}>Tentar novamente</button></section>;}
