'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { ConsentGate, useCookieConsent } from './cookie-consent';
import { clearGoogleAnalyticsCookies, GA_MEASUREMENT_ID, sendAnalyticsEvent } from '@/lib/analytics';

const SAFE_LOCATIONS = new Set([
  'site', 'hero', 'servicos', 'criacao-de-sites', 'sistemas-web', 'e-commerces',
  'automacao-inteligencia-artificial', 'analise-de-dados', 'card-analise', 'contato',
  'cases', 'pagina-cases', 'floating-whatsapp', 'footer', 'home-analysis',
  'contact', 'success', 'blog', 'blog-end',
]);

function safeLocation(value: string | undefined): string {
  return value && SAFE_LOCATIONS.has(value) ? value : 'other';
}

function redactVercelAnalytics(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (/^\/[a-f0-9]{64}\/?$/.test(url.pathname) || url.pathname.startsWith('/api/')) return null;
  url.search = '';
  url.hash = '';
  return { ...event, url: url.toString() };
}

function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const { registerCleanup } = useCookieConsent();
  const loaded = useRef(false);
  const lastPageView = useRef<string | null>(null);
  const currentPath = useRef(pathname);
  currentPath.current = pathname;

  const sendPageView = useCallback((path: string) => {
    if (lastPageView.current === path) return;
    lastPageView.current = path;
    sendAnalyticsEvent('page_view', {
      page_title: document.title,
      page_location: `${window.location.origin}${path}`,
      page_path: path,
    });
  }, []);

  useEffect(() => {
    let active = true;
    loaded.current = false;
    lastPageView.current = null;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    const initialPath = currentPath.current;
    let initialReferrer = '';
    try { if (document.referrer) initialReferrer = new URL(document.referrer).origin; } catch { /* Omit an invalid referrer. */ }
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${window.location.origin}${initialPath}`,
      page_path: initialPath,
      page_title: document.title,
      page_referrer: initialReferrer,
    });

    const script = document.createElement('script');
    script.id = 'bravite-google-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.onload = () => {
      if (!active) return;
      loaded.current = true;
      sendPageView(currentPath.current);
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const cta = target.closest<HTMLElement>('[data-analytics-cta]');
      if (cta) {
        sendAnalyticsEvent('cta_click', {
          cta_name: 'receive_free_analysis',
          cta_location: safeLocation(cta.dataset.analyticsLocation),
          page_path: window.location.pathname,
        });
      }

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      let host = '';
      try { host = new URL(anchor.href).hostname.toLowerCase(); } catch { return; }
      if (host !== 'wa.me' && host !== 'api.whatsapp.com' && host !== 'web.whatsapp.com') return;

      sendAnalyticsEvent('whatsapp_click', {
        link_location: safeLocation(anchor.dataset.analyticsLocation),
        page_path: window.location.pathname,
      });
    };

    const onLeadSuccess = (event: Event) => {
      const detail = (event as CustomEvent<{ location?: string }>).detail;
      sendAnalyticsEvent('generate_lead', {
        lead_type: 'free_analysis',
        lead_location: safeLocation(detail?.location),
        page_path: window.location.pathname,
      });
    };

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('bravite:lead-success', onLeadSuccess);
    script.onerror = () => { loaded.current = false; };
    document.head.appendChild(script);

    const cleanup = () => {
      active = false;
      loaded.current = false;
      lastPageView.current = null;
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('bravite:lead-success', onLeadSuccess);
      script.remove();
      delete window.gtag;
      delete window.dataLayer;
      clearGoogleAnalyticsCookies();
    };

    const unregister = registerCleanup('analytics', cleanup);
    return () => { unregister(); cleanup(); };
  }, [registerCleanup, sendPageView]);

  useEffect(() => {
    if (loaded.current) sendPageView(pathname);
  }, [pathname, sendPageView]);

  return null;
}

export function AnalyticsConsent() {
  return <ConsentGate category="analytics"><GoogleAnalyticsTracker/><Analytics beforeSend={redactVercelAnalytics}/></ConsentGate>;
}
