"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import {
  CONSENT_CHANNEL, CONSENT_MAX_AGE, DENIED_COOKIE_CHOICES,
  allowsCookieCategory, createCookieConsent, hasRevokedOptionalConsent, isCurrentConsent,
  readCookieConsent, serializeCookieConsent,
  type CookieChoices, type CookieConsent, type OptionalCookieCategory,
} from '@/lib/cookie-consent';
import styles from './cookie-consent.module.css';
import { isPrivateAdminPath } from '@/lib/admin-path';

type Cleanup = () => void;
interface CookieContextValue {
  ready: boolean;
  preferences: CookieConsent | null;
  hasConsent: (category: OptionalCookieCategory) => boolean;
  openPreferences: () => void;
  registerCleanup: (category: OptionalCookieCategory, cleanup: Cleanup) => Cleanup;
}
const CookieContext = createContext<CookieContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (!context) throw new Error('Cookie consent must be used inside CookieConsentProvider.');
  return context;
}

/** Only mount client-side optional integrations after a current, explicit opt-in. */
export function ConsentGate({ category, children }: { category: OptionalCookieCategory; children: ReactNode }) {
  const { hasConsent } = useCookieConsent();
  return hasConsent(category) ? children : null;
}

/** Optional integrations must return a cleanup that removes their own cookies/effects. */
export function useOptionalCookieEffect(category: OptionalCookieCategory, initialize: () => Cleanup) {
  const { hasConsent, registerCleanup } = useCookieConsent();
  const allowed = hasConsent(category);
  useEffect(() => {
    if (!allowed) return;
    const cleanup = initialize();
    let active = true;
    const stop = () => { if (active) { active = false; cleanup?.(); } };
    const unregister = registerCleanup(category, stop);
    return () => { unregister(); stop(); };
  }, [allowed, category, initialize, registerCleanup]);
}

export function CookiePreferencesButton({ className, children = 'Preferências de cookies' }: { className?: string; children?: ReactNode }) {
  const { openPreferences } = useCookieConsent();
  return <button type="button" className={className ?? styles.preferencesLink} onClick={openPreferences}>{children}</button>;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<CookieChoices>({ ...DENIED_COOKIE_CHOICES });
  const [notice, setNotice] = useState('');
  const current = useRef<CookieConsent | null>(null);
  const memoryOnly = useRef<CookieConsent | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const cleanups = useRef<Record<OptionalCookieCategory, Set<Cleanup>>>({ analytics: new Set(), marketing: new Set() });

  const stopDeniedResources = useCallback((next: CookieConsent | null) => {
    for (const category of ['analytics', 'marketing'] as const) {
      if (allowsCookieCategory(next, category)) continue;
      const registered = Array.from(cleanups.current[category]);
      cleanups.current[category].clear();
      for (const stop of registered) { try { stop(); } catch { /* The following reload also clears the JS context. */ } }
    }
  }, []);

  const registerCleanup = useCallback((category: OptionalCookieCategory, cleanup: Cleanup) => {
    cleanups.current[category].add(cleanup);
    return () => { cleanups.current[category].delete(cleanup); };
  }, []);

  const refresh = useCallback(() => {
    let next: CookieConsent | null = null;
    try { next = readCookieConsent(document.cookie); } catch { /* Blocked storage defaults to denial. */ }
    if (isCurrentConsent(memoryOnly.current)) next = memoryOnly.current;
    const revoked = hasRevokedOptionalConsent(current.current, next);
    stopDeniedResources(next);
    current.current = next;
    setPreferences(next);
    if (!next) setDismissed(false);
    setReady(true);
    if (revoked) window.location.reload();
  }, [stopDeniedResources]);

  useEffect(() => {
    refresh();
    const visible = () => { if (!document.hidden) refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    try {
      const connection = new BroadcastChannel(CONSENT_CHANNEL);
      connection.onmessage = refresh;
      channel.current = connection;
    } catch { /* Focus/visibility still synchronize browsers without BroadcastChannel. */ }
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
      channel.current?.close(); channel.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    if (!preferences) return;
    const remaining = preferences.savedAt + CONSENT_MAX_AGE * 1000 - Date.now() + 1;
    // Browser timers cannot represent the entire 180-day lifetime in one timeout.
    const timer = window.setTimeout(refresh, Math.max(1, Math.min(remaining, 2_147_000_000)));
    return () => window.clearTimeout(timer);
  }, [preferences, refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openPreferences = useCallback(() => {
    const saved = isCurrentConsent(current.current) ? current.current : null;
    setDraft({ analytics: saved?.analytics ?? false, marketing: saved?.marketing ?? false });
    setSettingsOpen(true);
  }, []);

  const save = (choices: CookieChoices) => {
    const next = createCookieConsent(choices);
    const revoked = hasRevokedOptionalConsent(current.current, next);
    let persisted = false;
    try {
      document.cookie = serializeCookieConsent(next, window.location.protocol === 'https:');
      const saved = readCookieConsent(document.cookie);
      persisted = saved?.savedAt === next.savedAt && saved.analytics === next.analytics && saved.marketing === next.marketing;
    } catch { /* Honor this choice in memory even if the browser refuses to persist it. */ }
    memoryOnly.current = persisted ? null : next;
    stopDeniedResources(next);
    current.current = next;
    setPreferences(next); setDismissed(false); setSettingsOpen(false);
    setNotice(persisted ? 'Preferências de cookies atualizadas.' : 'O navegador não permitiu guardar suas preferências. Sua escolha vale nesta visita.');
    if (persisted) { try { channel.current?.postMessage('updated'); } catch {} }
    // Removing a script element does not undo its global listeners/timers. Reload after revocation.
    if (revoked && persisted) window.location.reload();
  };

  const privateAdminPath = isPrivateAdminPath(path);
  const hasConsent = useCallback((category: OptionalCookieCategory) => ready && !privateAdminPath && allowsCookieCategory(preferences, category), [ready, preferences, privateAdminPath]);
  return <CookieContext.Provider value={{ ready, preferences, hasConsent, openPreferences, registerCleanup }}>
    {children}
    {!privateAdminPath && <CookieConsentUI
      bannerVisible={ready && !preferences && !dismissed && !settingsOpen}
      settingsOpen={settingsOpen}
      draft={draft}
      onDraft={setDraft}
      onSettings={openPreferences}
      onCloseSettings={() => setSettingsOpen(false)}
      onDismiss={() => setDismissed(true)}
      onSave={save}
    />}
    {notice && <div className={styles.notice} role="status">{notice}</div>}
  </CookieContext.Provider>;
}

interface CookieConsentUIProps {
  bannerVisible: boolean; settingsOpen: boolean; draft: CookieChoices;
  onDraft: (value: CookieChoices) => void; onSettings: () => void; onCloseSettings: () => void;
  onDismiss: () => void; onSave: (choices: CookieChoices) => void;
}

function CookieConsentUI({ bannerVisible, settingsOpen, draft, onDraft, onSettings, onCloseSettings, onDismiss, onSave }: CookieConsentUIProps) {
  const banner = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const accept = () => onSave({ analytics: true, marketing: true });
  const reject = () => onSave({ ...DENIED_COOKIE_CHOICES });

  useEffect(() => {
    if (settingsOpen && !dialog.current?.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.current?.showModal();
    } else if (!settingsOpen && dialog.current?.open) {
      dialog.current.close();
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
      else requestAnimationFrame(() => banner.current?.querySelector<HTMLButtonElement>('[data-cookie-settings]')?.focus());
    }
  }, [settingsOpen]);

  useEffect(() => {
    if (!bannerVisible || !banner.current) return;
    const element = banner.current;
    const measure = () => {
      const offset = element.offsetHeight + (parseFloat(window.getComputedStyle(element).bottom) || 0);
      document.documentElement.style.setProperty('--cookie-banner-offset', `${offset}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect(); window.removeEventListener('resize', measure);
      document.documentElement.style.removeProperty('--cookie-banner-offset');
    };
  }, [bannerVisible]);

  return <>
    <AnimatePresence>
      {bannerVisible && <motion.aside ref={banner} className={styles.banner} data-cookie-banner data-lenis-prevent aria-label="Aviso de cookies" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: .22 }}>
        <p className={styles.eyebrow}><span>BRAVITE</span> / SUA PRIVACIDADE</p>
        <button type="button" className={styles.close} onClick={onDismiss} aria-label="Fechar aviso sem autorizar cookies opcionais"><X size={18} aria-hidden="true" /></button>
        <p className={styles.bannerCopy}>Cookies essenciais mantêm o site funcionando e ficam sempre ativos. Você decide se autoriza cookies opcionais de análise e publicidade, quando disponíveis. Saiba mais na <Link href="/politica-de-cookies">Política de Cookies</Link>, na <Link href="/politica-de-privacidade">Política de Privacidade</Link> e nos <Link href="/termos-de-uso">Termos de Uso</Link>.</p>
        <div className={styles.actions}>
          <button type="button" className={`button button-outline ${styles.action}`} data-cookie-settings onClick={onSettings}>Definições de cookies</button>
          <button type="button" className={`button button-light ${styles.action}`} onClick={reject} aria-label="Rejeitar todos os cookies opcionais">Rejeitar todos</button>
          <button type="button" className={`button button-light ${styles.action}`} onClick={accept}>Aceitar todos os cookies</button>
        </div>
      </motion.aside>}
    </AnimatePresence>
    <dialog ref={dialog} className={styles.dialog} data-lenis-prevent aria-labelledby="cookie-settings-title" aria-describedby="cookie-settings-description" onCancel={event => { event.preventDefault(); onCloseSettings(); }} onClick={event => { if (event.target === dialog.current) onCloseSettings(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={styles.dialogContent}>
        <p className={styles.eyebrow}><span>VOCÊ DECIDE</span> / COOKIES</p>
        <button type="button" className={styles.close} onClick={onCloseSettings} aria-label="Fechar definições de cookies"><X size={20} aria-hidden="true" /></button>
        <h2 id="cookie-settings-title">Sua privacidade.<br />Suas preferências.</h2>
        <p className={styles.intro} id="cookie-settings-description">Escolha quais categorias opcionais você permite. Rejeitar não impede navegar nem solicitar uma análise. Você pode mudar sua escolha pelo rodapé a qualquer momento.</p>
        <p className={styles.inventoryNote}>Atualmente, usamos apenas cookies essenciais. Nenhuma ferramenta de análise ou publicidade está ativa nesta versão. Se isso mudar, atualizaremos a política e pediremos sua escolha novamente.</p>
        <label className={styles.category}>
          <span><span className={styles.categoryTitle}>Essenciais <span className={styles.required}>Sempre ativos</span></span><span className={styles.categoryDescription}>Guardam sua escolha de cookies e permitem o acesso seguro ao painel administrativo.</span></span>
          <input type="checkbox" checked disabled aria-label="Cookies essenciais, sempre ativos" />
        </label>
        <label className={styles.category}>
          <span><span className={styles.categoryTitle}>Análise e desempenho</span><span className={styles.categoryDescription}>Permitem medir visitas e entender como melhorar a experiência, quando houver ferramentas dessa categoria.</span></span>
          <input type="checkbox" checked={draft.analytics} onChange={event => onDraft({ ...draft, analytics: event.target.checked })} aria-label="Permitir cookies de análise e desempenho" />
        </label>
        <label className={styles.category}>
          <span><span className={styles.categoryTitle}>Publicidade e marketing</span><span className={styles.categoryDescription}>Permitem medir campanhas e personalizar anúncios, quando houver ferramentas dessa categoria.</span></span>
          <input type="checkbox" checked={draft.marketing} onChange={event => onDraft({ ...draft, marketing: event.target.checked })} aria-label="Permitir cookies de publicidade e marketing" />
        </label>
        <div className={styles.dialogActions}>
          <button type="button" className={`button button-light ${styles.action}`} onClick={reject} aria-label="Rejeitar todos os cookies opcionais">Rejeitar todos</button>
          <button type="button" className={`button button-light ${styles.action}`} onClick={accept}>Aceitar todos os cookies</button>
        </div>
        <button type="button" className={`button button-blue ${styles.action} ${styles.save}`} onClick={() => onSave(draft)}>Salvar minhas preferências</button>
        <p className={styles.finePrint}>A escolha é lembrada por até 180 dias. <Link href="/politica-de-cookies" onClick={onCloseSettings}>Consulte nossa Política de Cookies.</Link></p>
      </div>
    </dialog>
  </>;
}
