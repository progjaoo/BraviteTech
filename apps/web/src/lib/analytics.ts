export const GA_MEASUREMENT_ID = 'G-904J532392';

export type AnalyticsParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendAnalyticsEvent(name: string, params: AnalyticsParams): void {
  if (typeof window === 'undefined') return;
  const pagePath = window.location.pathname;
  let referrerOrigin = '';
  try { if (document.referrer) referrerOrigin = new URL(document.referrer).origin; } catch { /* Omit an invalid referrer. */ }
  const pageContext = {
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
    page_referrer: referrerOrigin,
  };
  window.gtag?.('set', pageContext);
  window.gtag?.('event', name, { ...pageContext, ...params });
}

export function reportSuccessfulLead(location: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('bravite:lead-success', { detail: { location } }));
}

export function clearGoogleAnalyticsCookies(): void {
  if (typeof document === 'undefined') return;
  const names = ['_ga', '_gid', '_gat', `_ga_${GA_MEASUREMENT_ID.slice(2)}`];
  const hostParts = window.location.hostname.split('.');
  const domains = new Set<string>(['']);
  for (let index = 0; index < hostParts.length - 1; index += 1) {
    domains.add(`; Domain=.${hostParts.slice(index).join('.')}`);
  }

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain}`;
    }
  }
}
