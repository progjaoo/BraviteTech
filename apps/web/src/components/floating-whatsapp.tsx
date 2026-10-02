import { brand } from '@/lib/brand';

export function FloatingWhatsApp() {
  return <a className="whatsapp-float" href={brand.whatsapp} target="_blank" rel="noopener noreferrer"
    aria-label="Conversar com a Bravite no WhatsApp (abre em nova aba)">
    <span className="whatsapp-float-label" aria-hidden="true">Converse com a Bravite</span>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.4-4.8A8.5 8.5 0 1 1 20.5 11.7Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round"/>
      <path d="m8.2 7.5.8-.3c.2-.1.5 0 .6.3l1 2c.1.2.1.4-.1.6l-.7.8c.7 1.4 1.8 2.5 3.3 3.2l.8-.9c.2-.2.4-.2.6-.1l2 1c.2.1.3.3.3.6l-.2.9c-.2.7-.9 1.2-1.7 1.1-4-.5-7.1-3.6-7.6-7.5-.1-.8.2-1.4.9-1.7Z" fill="currentColor"/>
    </svg>
  </a>;
}
