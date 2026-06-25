"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Brandmark from "@/components/Brandmark";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Brandmark size={32} />
          <span className="font-bold text-slate-900 dark:text-slate-100">ApplyPilot</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-[var(--brand)]"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/app"
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            Launch app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
