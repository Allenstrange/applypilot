"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";

const OPTIONS: { value: string; icon: LucideIcon; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--border)] p-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={`${label} theme`}
            title={label}
            className={`p-1.5 rounded-md transition-colors ${
              active
                ? "bg-[var(--surface-2)] text-[var(--text)]"
                : "text-[var(--text-faint)] hover:text-[var(--text)]"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
