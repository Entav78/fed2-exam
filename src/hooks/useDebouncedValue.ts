/** @file useDebouncedValue – returns a debounced copy of a changing value. */

import { useEffect, useState } from 'react';

/**
 * useDebouncedValue
 *
 * Returns a value that updates only after it stops changing for `delay` ms.
 * Useful for search inputs, API calls, and expensive computations.
 *
 * @typeParam T - The type of the input value.
 * @param value - The current (rapidly changing) value.
 * @param delay - Debounce delay in milliseconds (default: 300ms).
 * @returns The debounced value, updated after the delay elapses without further changes.
 *
 * @example
 * const [q, setQ] = useState('');
 * const debouncedQ = useDebouncedValue(q, 400);
 * useEffect(() => {
 *   if (!debouncedQ) return;
 *   fetchResults(debouncedQ);
 * }, [debouncedQ]);
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
