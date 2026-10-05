export const CONSENT_COOKIE_NAME = 'bravite_cookie_consent';
// Increment this when purposes, providers or cookie inventory change materially.
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60;
export const CONSENT_CHANNEL = 'bravite-cookie-consent';

export type OptionalCookieCategory = 'analytics' | 'marketing';
export type CookieChoices = Record<OptionalCookieCategory, boolean>;
export type CookieConsent = CookieChoices & { version: number; savedAt: number };
export const DENIED_COOKIE_CHOICES: CookieChoices = { analytics: false, marketing: false };

export function createCookieConsent(choices: CookieChoices, now = Date.now()): CookieConsent {
  return { version: CONSENT_VERSION, savedAt: now, analytics: choices.analytics === true, marketing: choices.marketing === true };
}

export function isCurrentConsent(value: unknown, now = Date.now()): value is CookieConsent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return Object.keys(candidate).length === 4 &&
    candidate.version === CONSENT_VERSION &&
    typeof candidate.analytics === 'boolean' && typeof candidate.marketing === 'boolean' &&
    typeof candidate.savedAt === 'number' && Number.isSafeInteger(candidate.savedAt) &&
    candidate.savedAt > 0 && candidate.savedAt <= now + 60_000 &&
    candidate.savedAt + CONSENT_MAX_AGE * 1000 > now;
}

export function readCookieConsent(cookieHeader: string, now = Date.now()): CookieConsent | null {
  const prefix = `${CONSENT_COOKIE_NAME}=`;
  const cookie = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!cookie) return null;
  const encoded = cookie.slice(prefix.length);
  if (encoded.length > 512) return null;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(encoded));
    return isCurrentConsent(value, now) ? value : null;
  } catch { return null; }
}

export function serializeCookieConsent(consent: CookieConsent, secure: boolean): string {
  return `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function allowsCookieCategory(consent: CookieConsent | null, category: OptionalCookieCategory, now = Date.now()): boolean {
  return isCurrentConsent(consent, now) && consent[category] === true;
}

export function hasRevokedOptionalConsent(previous: CookieConsent | null, next: CookieConsent | null): boolean {
  // Previous may have just expired: resources already initialized still need teardown.
  return Boolean(previous && ((previous.analytics && !next?.analytics) || (previous.marketing && !next?.marketing)));
}
