"use client";

import { useSyncExternalStore } from "react";

// External-store snapshots live at module scope so the clock read stays out of
// component render (keeps the react-hooks purity/effect rules happy).
const subscribe = () => () => {};

const getHydratedClient = () => true;
const getHydratedServer = () => false;

let nowCache: number | null = null;
const getNowClient = () => (nowCache ??= Date.now());
const getNowServer = () => 0;

/**
 * True only after the component has mounted on the client. Use to gate
 * rendering of persisted (localStorage) state and avoid hydration mismatches.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, getHydratedClient, getHydratedServer);
}

/** The wall-clock time at first client render (stable across renders). */
export function useNow() {
  return useSyncExternalStore(subscribe, getNowClient, getNowServer);
}
