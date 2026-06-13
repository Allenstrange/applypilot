import Link from "next/link";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
              AP
            </div>
            <span className="font-bold text-slate-900">ApplyPilot</span>
          </div>
          <p className="text-sm text-slate-500 max-w-xs">
            Your AI co-pilot for tailoring applications, faster — CVs, cover
            letters, interview prep, and tracking in one place.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { href: "/features", label: "Features" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/app", label: "Launch app" },
          ]}
        />
        <FooterCol
          title="App"
          links={[
            { href: "/app/profile", label: "Master Profile" },
            { href: "/app/analyze", label: "Job Analysis" },
            { href: "/app/tracker", label: "Tracker" },
          ]}
        />
        <FooterCol
          title="Setup"
          links={[{ href: "/app/settings", label: "AI Settings" }]}
        />
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>© {YEAR} ApplyPilot</span>
          <span>Runs in your browser · your data stays local</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-slate-600 hover:text-indigo-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
