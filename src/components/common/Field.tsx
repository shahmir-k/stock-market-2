// Form input with label-above, hairline underline (no boxed border),
// optional helper text and error. Replaces the previous boxed-input pattern.

import { forwardRef } from 'react';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, helper, error, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? `f-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={`rule border-b bg-transparent py-1.5 text-base outline-none transition-colors duration-[var(--dur-fast)] focus:border-[var(--color-accent)] ${
          error ? 'border-[var(--color-danger)]' : ''
        }`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
});
