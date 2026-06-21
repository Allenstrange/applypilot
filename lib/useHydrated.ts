"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// External-store snapshots live at module scope so the clock read stays out of
// component render (keeps the react-hooks purity/effect rules happy).
const subscribe = () => () => {};

let nowCache: number | null = null;
const getNowClient = () => (nowCache ??= Date.now());
const getNowServer = () => 0;

/**
 * True only after the component has mounted on the client. Use to gate
 * rendering of persisted (localStorage) state and avoid hydration mismatches.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

/** The wall-clock time at first client render (stable across renders). */
export function useNow() {
  return useSyncExternalStore(subscribe, getNowClient, getNowServer);
}
