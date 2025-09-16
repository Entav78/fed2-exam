/** @file Button – shared button component with size/variant styles and a loading state. */

import React from 'react';

/** Visual variants supported by {@link Button}. */
type Variant = 'outline' | 'primary' | 'danger' | 'dangerOutline' | 'ghost';
/** Size variants supported by {@link Button}. */
type Size = 'sm' | 'md' | 'lg';

/** Props for {@link Button}. Extends native button attributes. */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style variant (defaults to `outline`). */
  variant?: Variant;
  /** Size token (defaults to `md`). */
  size?: Size;
  /** When true, disables the button and shows a spinner + "Loading…". */
  isLoading?: boolean;
};

/**
 * Concatenate truthy class name parts.
 * @param parts Class name tokens (strings or falsy)
 * @returns Space-joined class string
 */
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/** Tailwind classes per size token. */
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/** Tailwind classes per visual variant. */
const variants: Record<Variant, string> = {
  outline: `
    bg-transparent text-fg border border-border
    hover:bg-[rgb(var(--fg))/0.08] hover:border-[rgb(var(--fg))/25]
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40]
  `,
  dangerOutline: `
    bg-transparent text-fg border border-border
    hover:bg-danger/10 hover:border-danger/60
    focus-visible:ring-2 focus-visible:ring-danger/35
  `,
  primary: `
    bg-brand text-on-brand hover:bg-brand/90
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40]
  `,
  ghost: `
    text-fg hover:bg-[rgb(var(--fg))/0.06]
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/30]
  `,
  danger: `
    bg-danger text-[rgb(var(--on-danger,255 255 255))] hover:bg-danger/90
    focus-visible:ring-2 focus-visible:ring-danger/35
  `,
};

/**
 * Button
 *
 * Reusable button with consistent size/variant styling and an accessible loading state.
 * @remarks When `isLoading` is true, the button is disabled and sets `aria-busy`.
 */
export function Button({
  children,
  variant = 'outline',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = isLoading || !!disabled;

  return (
    <button
      type={type}
      aria-busy={isLoading || undefined}
      disabled={isDisabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[rgb(var(--card))]',
        sizes[size],
        variants[variant],
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {isLoading && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      <span>{isLoading ? 'Loading…' : children}</span>
    </button>
  );
}

export default Button;
