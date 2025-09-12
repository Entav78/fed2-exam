import React from 'react';

type Variant = 'outline' | 'primary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const variants: Record<Variant, string> = {
  /** strong CTA (Save, Login, Register) */
  /** bordered neutral actions (Clear, Open, Manage, Change dates, etc.) */
  outline: `
    bg-transparent text-fg border border-border
    hover:bg-[rgb(var(--fg))/0.08] hover:border-[rgb(var(--fg))/25]
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40]
  `,

  primary: `
    bg-brand text-on-brand
    hover:bg-brand/90
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40]
  `,

  /** quiet text like “Close” in a dialog header */
  ghost: `
    text-fg hover:bg-[rgb(var(--fg))/0.06]
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/30]
  `,
  /** destructive */
  danger: `
    bg-danger text-white hover:bg-danger/90
    focus-visible:ring-2 focus-visible:ring-[rgb(var(--danger))/35]
  `,
};

export function Button({
  children,
  variant = 'outline', // ← was "primary"
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...rest
}: Props) {
  const isDisabled = isLoading || !!disabled;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[rgb(var(--card))]',
        sizes[size],
        variants[variant],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );
}

export default Button;
