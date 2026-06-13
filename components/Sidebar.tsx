"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Search,
  PenLine,
  ClipboardList,
  Settings,
  ArrowLeft,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/profile", label: "Master Profile", icon: User },
  { href: "/app/resumes", label: "Resumes", icon: FileText },
  { href: "/app/analyze", label: "Job Analysis", icon: Search },
  { href: "/app/editor", label: "Editing Room", icon: PenLine },
  { href: "/app/tracker", label: "Application Tracker", icon: ClipboardList },
  { href: "/app/settings", label: "AI Settings", icon: Settings },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold">
        AP
      </div>
      <div>
        <div className="font-bold text-[var(--text)]">ApplyPilot</div>
        <div className="text-xs text-[var(--text-faint)]">AI Application Assistant</div>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`sidebar-item w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm ${
              active ? "active" : ""
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
      <ThemeToggle />
      <Link href="/" className="text-xs text-[var(--text-faint)] flex items-center gap-2 hover:text-[var(--text-muted)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to site
      </Link>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 h-14">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-[var(--surface)] border-r border-[var(--border)] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-5 flex-col sticky top-0 h-screen">
        <div className="mb-8">
          <Logo />
        </div>
        <NavLinks />
        <SidebarFooter />
      </aside>
    </>
  );
}
