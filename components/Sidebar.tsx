"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  GitCompare,
  LayoutTemplate,
  Search,
  Target,
  PenLine,
  Mic,
  ClipboardList,
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Brandmark from "@/components/Brandmark";

const COLLAPSE_KEY = "applypilot_sidebar_collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/app", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Build",
    items: [
      { href: "/app/resumes", label: "My CVs", icon: FileText },
      { href: "/app/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/app/compare", label: "Compare CVs", icon: GitCompare },
      { href: "/app/profile", label: "Master Profile", icon: User },
    ],
  },
  {
    label: "Apply",
    items: [
      { href: "/app/analyze", label: "Job Analysis", icon: Search },
      { href: "/app/match", label: "Job Matcher", icon: Target },
      { href: "/app/editor", label: "Editing Room", icon: PenLine },
      { href: "/app/interview", label: "Mock Interview", icon: Mic },
    ],
  },
  {
    label: "Track",
    items: [
      { href: "/app/tracker", label: "Application Tracker", icon: ClipboardList },
      { href: "/app/insights", label: "Insights", icon: BarChart3 },
    ],
  },
  {
    label: "Setup",
    items: [{ href: "/app/settings", label: "AI Settings", icon: Settings }],
  },
];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="ApplyPilot home"
    >
      <Brandmark size={collapsed ? 32 : 36} />
      {collapsed ? null : (
        <div>
          <div className="font-bold text-[var(--text)]">ApplyPilot</div>
          <div className="text-xs text-[var(--text-faint)]">
            AI Application Assistant
          </div>
        </div>
      )}
    </Link>
  );
}

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto scrollbar -mx-1 px-1">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} className="mb-4 last:mb-0">
          {collapsed ? (
            gi === 0 ? null : (
              <div className="mx-auto mb-2 h-px w-6 bg-[var(--border)]" />
            )
          ) : (
            <div className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/app" ? pathname === "/app" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  data-tour={href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={`sidebar-item w-full text-sm rounded-lg flex items-center ${
                    collapsed
                      ? "justify-center px-0 py-2.5"
                      : "gap-3 px-4 py-2 text-left"
                  } ${active ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {collapsed ? (
                    <span className="sr-only">{label}</span>
                  ) : (
                    label
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-[var(--border)] ${
        collapsed ? "flex flex-col items-center gap-3" : "space-y-3"
      }`}
    >
      <ThemeToggle />
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("applypilot:start-tour"))}
        data-testid="start-tour-btn"
        title={collapsed ? "Take a tour" : undefined}
        className={`text-xs text-[var(--text-faint)] flex items-center hover:text-[var(--text-muted)] ${
          collapsed ? "justify-center" : "gap-2"
        }`}
      >
        <Compass className="w-3.5 h-3.5 shrink-0" />
        {collapsed ? <span className="sr-only">Take a tour</span> : "Take a tour"}
      </button>
      <Link
        href="/"
        title={collapsed ? "Back to site" : undefined}
        className={`text-xs text-[var(--text-faint)] flex items-center hover:text-[var(--text-muted)] ${
          collapsed ? "justify-center" : "gap-2"
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
        {collapsed ? (
          <span className="sr-only">Back to site</span>
        ) : (
          "Back to site"
        )}
      </Link>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the persisted desktop collapse preference after mount.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable — keep the default expanded state */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore storage failures */
      }
      return next;
    });
  }

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
      <aside
        className={`hidden lg:flex shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-5 flex-col sticky top-0 h-screen transition-[width] duration-200 ease-out ${
          collapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div
          className={`mb-8 flex items-center ${
            collapsed ? "flex-col gap-3" : "justify-between"
          }`}
        >
          <Logo collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>
        <NavLinks collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}
