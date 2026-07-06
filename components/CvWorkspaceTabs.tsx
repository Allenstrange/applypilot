"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutTemplate, GitCompare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TabDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { href: "/app/resumes", label: "My CVs", icon: FileText },
  { href: "/app/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/app/compare", label: "Compare", icon: GitCompare },
];

/**
 * One workspace for everything you do to a CV's shape and design. Folds what
 * used to be three separate sidebar entries into a single tabbed surface so the
 * navigation stays short and the three views feel like one place.
 */
export default function CvWorkspaceTabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <div
      className={`flex items-center gap-1 border-b border-[var(--border)] mb-6 ${className}`}
      data-testid="cv-workspace-tabs"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/app/resumes" ? pathname === "/app/resumes" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative -mb-px inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
