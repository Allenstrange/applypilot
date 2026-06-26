"use client";

import { useToastStore } from "@/lib/toast";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] space-y-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass text-sm text-slate-800 px-4 py-3 rounded-lg max-w-sm dark:text-slate-100"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
