"use client";
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from './header';
import { FloatingWhatsApp } from './floating-whatsapp';
import { isPrivateAdminPath } from '@/lib/admin-path';
export function SiteShell({children,footer}:{children:ReactNode;footer:ReactNode}){const path=usePathname();if(isPrivateAdminPath(path))return <>{children}</>;return <><a className="skip-link" href="#main-content">Ir para o conteúdo</a><Header/><main id="main-content">{children}</main>{footer}<FloatingWhatsApp/></>;}
