'use client';

import { useEffect, useRef, useState } from 'react';

// IntersectionObserver-based fade-up. Use for elements below the fold
// where the on-mount `fade-up` animation would already be over by the
// time the user scrolls there. Honors prefers-reduced-motion.
//
// Reduced-motion check uses lazy useState initializer (runs once at mount,
// not inside an effect) to avoid React's set-state-in-effect lint rule.
export function FadeIn({
  children,
  delay = 0,
  className = '',
  as: As = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer';
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  });

  useEffect(() => {
    if (visible) return; // already revealed (reduced-motion)
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  return (
    <As
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </As>
  );
}
