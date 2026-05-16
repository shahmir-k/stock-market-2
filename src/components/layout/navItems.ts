// Shared navigation items. Used by SidebarNav (desktop) and BottomNav
// (mobile). Order matches PRD §8.2.

export type NavItem = {
  href: string;
  label: string;
  // Mobile-visible bottom nav items (PRD §8.2 mobile shows 4 + More).
  showOnMobile: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard', showOnMobile: true },
  { href: '/browse',          label: 'Browse',    showOnMobile: true },
  { href: '/portfolio',       label: 'Portfolio', showOnMobile: true },
  { href: '/learn',           label: 'Learn',     showOnMobile: true },
  { href: '/compound-growth', label: 'Compound',  showOnMobile: false },
  { href: '/settings',        label: 'Settings',  showOnMobile: false },
];

// Items shown under "More" on mobile (PRD §8.2).
export const MORE_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => !item.showOnMobile,
);
