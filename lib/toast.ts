// ============== TOASTS ==============

import { create } from "zustand";

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Fire a toast from anywhere on the client. */
export const toast = (message: string) => useToastStore.getState().push(message);
