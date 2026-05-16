'use client';

export function LearningSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="border-b rule pb-3">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search the glossary"
        aria-label="Search terms"
        className="w-full bg-transparent text-lg outline-none placeholder:text-text-muted md:text-2xl"
      />
    </div>
  );
}
