import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'form';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style */
  variant?: ButtonVariant;
  /** Show loading state and disable clicks */
  isLoading?: boolean;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  ...rest
}: Props) {
  const base = 'px-4 py-2 rounded font-medium transition-colors duration-300';

  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-primary 
      hover:bg-primary-hover 
      text-text-button-light
    `,
    secondary: `
      bg-secondary
      hover:bg-secondary-hover
      text-text-base
      border-dark
    `,
    form: `
      bg-secondary
      hover:bg-secondary-hover
      text-inherit
      border border-border-light
      dark:text-text-dark
      dark:border-border-dark
    `,
  };

  const isDisabled = isLoading || !!disabled;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={cx(
        base,
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
