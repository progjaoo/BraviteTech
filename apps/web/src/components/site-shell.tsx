"use client";
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from './header';
import { FloatingWhatsApp } from './floating-whatsapp';
export function SiteShell({children,footer}:{children:ReactNode;footer:ReactNode}){const path=usePathname();if(path.startsWith('/admin'))return <>{children}</>;return <><a className="skip-link" href="#main-content">Ir para o conteúdo</a><Header/><main id="main-content">{children}</main>{footer}<FloatingWhatsApp/></>;}
