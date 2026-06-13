"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Search,
  PenLine,
  ClipboardList,
  Settings,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/profile", label: "Master Profile", icon: User },
  { href: "/app/analyze", label: "Job Analysis", icon: Search },
  { href: "/app/editor", label: "Editing Room", icon: PenLine },
  { href: "/app/tracker", label: "Application Tracker", icon: ClipboardList },
  { href: "/app/settings", label: "AI Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-5 flex flex-col sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
          AP
        </div>
        <div>
          <div className="font-bold text-slate-900">ApplyPilot</div>
          <div className="text-xs text-slate-400">AI Application Assistant</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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

      <Link
        href="/"
        className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 flex items-center gap-2 hover:text-slate-600"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to site
      </Link>
    </aside>
  );
}
