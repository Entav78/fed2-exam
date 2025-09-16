/** @file useFocusTrap – trap keyboard focus within a container (ESC to close, optional focus restore). */

import { type MutableRefObject, type RefObject, useEffect, useRef } from 'react';

type Options = {
  /** Enable/disable the trap. When false, no listeners are attached. */
  active: boolean;
  /** Optional handler invoked when the user presses Escape. */
  onEscape?: () => void;
  /** Return focus to the element focused before activation (default: true). */
  restoreFocus?: boolean;
};

/**
 * Accepts both `RefObject` and `MutableRefObject`, matching what `useRef<HTMLDivElement>(null)` returns.
 */
type AnyRef<T extends HTMLElement> = RefObject<T> | MutableRefObject<T | null>;

/**
 * useFocusTrap
 *
 * Traps `Tab`/`Shift+Tab` navigation inside the given container while `active` is true.
 * - Focus moves to the first focusable (or the container) when activated.
 * - `Tab` cycles within the container; focus never escapes.
 * - `Escape` triggers `onEscape` if provided.
 * - When unmounted or deactivated, optionally restores focus to the previously focused element.
 *
 * @typeParam T - HTMLElement subtype for the container (e.g., HTMLDivElement).
 * @param containerRef - Ref to the focus trap container.
 * @param options - {@link Options} configuring activation, escape handler, and focus restoration.
 *
 * @example
 * const panelRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(panelRef, { active: isOpen, onEscape: onClose, restoreFocus: true });
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: AnyRef<T>,
  { active, onEscape, restoreFocus = true }: Options,
) {
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  function getFocusable(container: HTMLElement) {
    const selectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
    );
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    if (restoreFocus) {
      lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    }

    const focusables = getFocusable(container);
    (focusables[0] || container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!container.contains(document.activeElement)) return;

      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = getFocusable(container);
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocus) {
        lastFocusedRef.current?.focus?.();
      }
    };
  }, [active, onEscape, restoreFocus, containerRef]);
}
