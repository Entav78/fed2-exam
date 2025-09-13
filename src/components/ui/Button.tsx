import React from 'react';

type Variant = 'outline' | 'primary' | 'danger' | 'dangerOutline' | 'ghost';
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
        // base
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        // focus ring (add the ring itself + color)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))/40] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[rgb(var(--card))]',
        // size + variant
        sizes[size],
        variants[variant],
        // disabled state handled by CSS (works because of the disabled attribute)
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
