import { Link } from 'react-router-dom';

type Props = {
  to?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function MiniButton({ to, children, className = '', ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded border border-border-light px-3 py-1 text-sm leading-tight hover:bg-muted whitespace-nowrap';
  if (to) {
    return (
      <Link to={to} className={`${base} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button {...rest} className={`${base} ${className}`}>
      {children}
    </button>
  );
}
