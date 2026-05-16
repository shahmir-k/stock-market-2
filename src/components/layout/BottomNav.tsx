'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MORE_ITEMS, NAV_ITEMS } from './navItems';

export function BottomNav() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((i) => i.showOnMobile);
  const showMoreActive = MORE_ITEMS.some((i) => pathname?.startsWith(i.href));

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-surface md:hidden"
    >
      {mobileItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === item.href
            : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-2 text-xs ${
              isActive ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/settings"
        aria-current={showMoreActive ? 'page' : undefined}
        className={`flex flex-col items-center justify-center py-2 text-xs ${
          showMoreActive ? 'text-accent' : 'text-text-secondary'
        }`}
      >
        More
      </Link>
    </nav>
  );
}
