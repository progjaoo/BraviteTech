"use client";

import { useSyncExternalStore } from 'react';

const query='(prefers-reduced-motion: reduce)';
function subscribe(update:()=>void) {
 const media=window.matchMedia(query);
 media.addEventListener('change',update);
 return ()=>media.removeEventListener('change',update);
}
const snapshot=()=>window.matchMedia(query).matches;
const serverSnapshot=()=>false;

/** Same initial SSR/client snapshot, with live updates after hydration. */
export function usePrefersReducedMotion() {
 return useSyncExternalStore(subscribe,snapshot,serverSnapshot);
}
