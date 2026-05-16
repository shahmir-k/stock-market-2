'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from './navItems';

// Fluid Island bottom nav (mobile). Floating glass pill detached from the
// edges with backdrop blur — replaces the edge-to-edge bottom bar. Per
// high-end-visual-design §5A: backdrop-blur only on fixed/sticky elements.
export function BottomNav() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((i) => i.showOnMobile);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-max max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border rule bg-canvas/80 px-2 py-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl md:hidden"
    >
      {mobileItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === item.href
            : (pathname?.startsWith(item.href) ?? false);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] active:scale-[0.96] ${
              isActive
                ? 'bg-ink text-canvas'
                : 'text-text-secondary hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/settings"
        aria-current={pathname?.startsWith('/settings') ? 'page' : undefined}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] active:scale-[0.96] ${
          pathname?.startsWith('/settings') || pathname?.startsWith('/compound-growth')
            ? 'bg-ink text-canvas'
            : 'text-text-secondary hover:text-ink'
        }`}
      >
        More
      </Link>
    </nav>
  );
}
