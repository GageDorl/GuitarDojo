import Link from "next/link";
import { NAV_ITEMS, SITE } from "@/config/site";
import { ThemeToggle } from "./ThemeToggle";

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)" />
      <g stroke="var(--accent-contrast)" strokeWidth="1.6" opacity="0.9">
        <line x1="10" y1="8" x2="10" y2="24" />
        <line x1="16" y1="8" x2="16" y2="24" />
        <line x1="22" y1="8" x2="22" y2="24" />
      </g>
      <line x1="7" y1="12" x2="25" y2="12" stroke="var(--accent-contrast)" strokeWidth="2.4" />
      <circle cx="16" cy="18" r="3.2" fill="var(--accent-contrast)" />
    </svg>
  );
}

export function SiteHeader() {
  const enabled = NAV_ITEMS.filter((item) => item.enabled);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {enabled.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
