/** @file CollapsibleFieldset – lightweight collapsible section using native <details>/<summary>. */

import type { PropsWithChildren, ReactNode } from 'react';

/**
 * Props for {@link CollapsibleFieldset}.
 */
type Props = {
  /** Section title shown in the summary row. */
  title: string;
  /** Optional preview node (e.g., a thumbnail) displayed before the title. */
  preview?: ReactNode;
  /** Whether the fieldset is open by default. */
  defaultOpen?: boolean;
  /** Extra classes for the outer container. */
  className?: string;
};

/**
 * CollapsibleFieldset
 *
 * A simple container that reveals its children when expanded.
 * @remarks Uses native `<details>/<summary>` for built-in semantics and keyboard support.
 */
export default function CollapsibleFieldset({
  title,
  preview,
  defaultOpen = false,
  className = '',
  children,
}: PropsWithChildren<Props>) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded border border-border bg-card ${className}`}
    >
      <summary className="list-none cursor-pointer select-none flex items-center gap-3 p-3 hover:bg-[rgb(var(--fg))/0.04]">
        {preview}
        <span className="font-medium flex-1">{title}</span>
        <svg
          className="h-4 w-4 transition-transform group-open:rotate-180 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </summary>

      <div className="p-3 pt-0 grid gap-3">{children}</div>
    </details>
  );
}
