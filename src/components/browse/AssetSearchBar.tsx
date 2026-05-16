'use client';

import { useState } from 'react';

export function AssetSearchBar({
  initialQuery = '',
  onSearch,
}: {
  initialQuery?: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="flex items-baseline gap-3 border-b rule pb-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ticker or company name"
        aria-label="Search stocks and ETFs"
        className="flex-1 bg-transparent text-lg outline-none placeholder:text-text-muted md:text-2xl"
      />
      <button
        type="submit"
        className="text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline transition-opacity duration-[var(--dur-fast)] active:opacity-70"
      >
        Search →
      </button>
    </form>
  );
}
