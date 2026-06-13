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
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Master Profile", icon: User },
  { href: "/analyze", label: "Job Analysis", icon: Search },
  { href: "/editor", label: "Editing Room", icon: PenLine },
  { href: "/tracker", label: "Application Tracker", icon: ClipboardList },
  { href: "/settings", label: "AI Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/5 p-5 flex flex-col sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          AP
        </div>
        <div>
          <div className="font-bold text-white">ApplyPilot</div>
          <div className="text-xs text-gray-500">AI Application Assistant</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm ${
                active ? "active" : ""
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/5 text-xs text-gray-500">
        <div>Data stored locally</div>
        <div className="mt-1">v4.0 — Next.js platform</div>
      </div>
    </aside>
  );
}
