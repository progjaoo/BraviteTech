import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_COOKIE_NAME, CONSENT_MAX_AGE, CONSENT_VERSION,
  allowsCookieCategory, createCookieConsent, hasRevokedOptionalConsent,
  isCurrentConsent, readCookieConsent, serializeCookieConsent,
} from '../apps/web/src/lib/cookie-consent.ts';

const now = Date.UTC(2026, 9, 5);
const accepted = createCookieConsent({ analytics: true, marketing: true }, now);
const rejected = createCookieConsent({ analytics: false, marketing: false }, now);
const header = value => `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}`;

test('no choice, rejection and category-specific opt-in deny unauthorized resources', () => {
  for (const category of ['analytics', 'marketing']) {
    assert.equal(allowsCookieCategory(null, category, now), false);
    assert.equal(allowsCookieCategory(rejected, category, now), false);
    assert.equal(allowsCookieCategory(accepted, category, now), true);
  }
  const custom = createCookieConsent({ analytics: true, marketing: false }, now);
  assert.equal(allowsCookieCategory(custom, 'analytics', now), true);
  assert.equal(allowsCookieCategory(custom, 'marketing', now), false);
});

test('choice is readable alongside unrelated cookies with exact cookie-name matching', () => {
  assert.deepEqual(readCookieConsent(`other=abc; ${header(accepted)}; another=xyz`, now), accepted);
  assert.equal(readCookieConsent(`fake_${header(accepted)}`, now), null);
  assert.equal(readCookieConsent(`other=${encodeURIComponent(header(accepted))}`, now), null);
});

for (const [name, input] of [
  ['invalid URI encoding', `${CONSENT_COOKIE_NAME}=%XX`],
  ['invalid JSON', `${CONSENT_COOKIE_NAME}=%7B`],
  ['excessively large cookie', `${CONSENT_COOKIE_NAME}=${'a'.repeat(513)}`],
  ['empty cookie', `${CONSENT_COOKIE_NAME}=`],
  ['null payload', header(null)],
  ['array payload', header([accepted])],
  ['additional fields', header({ ...accepted, identity: 'unexpected' })],
  ['missing fields', header({ version: CONSENT_VERSION, savedAt: now, analytics: true })],
  ['outdated policy', header({ ...accepted, version: CONSENT_VERSION - 1 })],
  ['future policy', header({ ...accepted, version: CONSENT_VERSION + 1 })],
  ['string authorization', header({ ...accepted, analytics: 'true' })],
  ['numeric authorization', header({ ...accepted, marketing: 1 })],
  ['null authorization', header({ ...accepted, marketing: null })],
  ['future timestamp', header({ ...accepted, savedAt: now + 60_001 })],
  ['string timestamp', header({ ...accepted, savedAt: String(now) })],
  ['fractional timestamp', header({ ...accepted, savedAt: now + .5 })],
  ['zero timestamp', header({ ...accepted, savedAt: 0 })],
  ['negative timestamp', header({ ...accepted, savedAt: -1 })],
]) {
  test(`${name} cannot enable optional resources`, () => {
    const result = readCookieConsent(input, now);
    assert.equal(result, null);
    assert.equal(allowsCookieCategory(result, 'analytics', now), false);
    assert.equal(allowsCookieCategory(result, 'marketing', now), false);
  });
}

test('180-day validity is enforced even when a cookie is still present', () => {
  const expires = now + CONSENT_MAX_AGE * 1000;
  assert.equal(isCurrentConsent(accepted, expires - 1), true);
  assert.equal(readCookieConsent(header(accepted), expires), null);
  assert.equal(allowsCookieCategory(accepted, 'analytics', expires + 1), false);
});

test('revocation is recognized for either category, expiration or cookie deletion', () => {
  assert.equal(hasRevokedOptionalConsent(accepted, rejected), true);
  assert.equal(hasRevokedOptionalConsent(accepted, { ...accepted, marketing: false }), true);
  assert.equal(hasRevokedOptionalConsent(accepted, { ...accepted, analytics: false }), true);
  assert.equal(hasRevokedOptionalConsent(accepted, null), true);
  assert.equal(hasRevokedOptionalConsent(rejected, accepted), false);
  assert.equal(hasRevokedOptionalConsent(null, accepted), false);
  assert.equal(hasRevokedOptionalConsent(accepted, accepted), false);
});

test('preference persistence uses host-only, bounded lifetime and HTTPS Secure', () => {
  const https = serializeCookieConsent(accepted, true);
  assert.match(https, /; Path=\/; Max-Age=15552000; SameSite=Lax; Secure$/);
  assert.doesNotMatch(https, /Domain=|HttpOnly/);
  const http = serializeCookieConsent(rejected, false);
  assert.doesNotMatch(http, /; Secure/);
  assert.deepEqual(readCookieConsent(https, now), accepted);
  assert.deepEqual(readCookieConsent(http, now), rejected);
});
