'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from './navItems';

// Text-link sidebar nav. Active state is a thin accent rule on the left
// and bolder ink weight — no boxes, no fills, no rounded chips.
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex md:flex-col md:w-52 md:shrink-0 md:py-10 md:pl-6 md:pr-2"
    >
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : (pathname?.startsWith(item.href) ?? false);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative block py-2 pl-4 text-sm transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] ${
                  isActive
                    ? 'font-medium text-ink'
                    : 'text-text-secondary hover:text-ink'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 transition-all duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${
                    isActive
                      ? 'bg-[var(--color-accent)] h-5'
                      : 'bg-transparent'
                  }`}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
