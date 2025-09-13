import { Link } from 'react-router-dom';

type Props = { className?: string; to?: string };

export default function NewVenueTile({ className = '', to = '/manage/new' }: Props) {
  return (
    <Link
      to={to}
      aria-label="Create new venue"
      className={[
        // the card matches other venue cards
        'card grid place-items-center transition group',
        'hover:shadow-md hover:-translate-y-[1px]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[rgb(var(--brand))/40]',
        className,
      ].join(' ')}
    >
      {/* chip inside the card */}
      <span
        className={[
          'inline-flex items-center gap-2 rounded-md border border-dashed',
          'border-border px-3 py-2 text-sm text-fg',
          'group-hover:bg-[rgb(var(--fg))/0.04] group-hover:border-[rgb(var(--fg))/25]',
        ].join(' ')}
      >
        <span aria-hidden>＋</span>
        Create new venue
      </span>
    </Link>
  );
}
