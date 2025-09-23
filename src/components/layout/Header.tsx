/**
 * @file Header – sticky responsive site header with primary nav and auth controls.
 *
 * Responsibilities
 * - Desktop: brand + primary nav + auth actions on a single row. A second row shows
 *   Theme (always) and “Logged in as …” when authenticated.
 * - Mobile: hamburger toggles a full-screen drawer rendered via `MobileMenuPortal`.
 * - While the mobile menu is open, body scrolling is locked.
 *
 * Accessibility
 * - The hamburger button exposes `aria-expanded` and `aria-haspopup="dialog"`.
 * - The mobile drawer itself is a `role="dialog"` (handled inside `MobileMenuPortal`).
 * - The close button in the drawer has an explicit `aria-label`.
 */

import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import LogoutButton from '@/components/auth/LogoutButton';
import MobileMenuPortal from '@/components/layout/MobileMenuPortal';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAuthStore } from '@/store/authStore';

/**
 * Returns class names for a `NavLink` based on its active state.
 * `NavLink` will also set `aria-current="page"` when active.
 *
 * @param {{ isActive: boolean }} params React Router provides `isActive` to the className callback.
 * @returns {string} Tailwind utility classes for the link.
 */
const link = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1 rounded ${isActive ? 'underline' : 'hover:underline'}`;

/**
 * Header component.
 *
 * UI structure:
 * - Left: brand link
 * - Right (desktop): primary nav + auth actions
 * - Mobile: hamburger that opens a full-screen drawer (via `MobileMenuPortal`)
 *
 * Side effects:
 * - Adds/removes `overflow-hidden` on `<body>` while the mobile menu is open.
 *
 * @returns {JSX.Element} Sticky site header.
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const role = useAuthStore((s) => s.role());
  const isManager = role === 'manager';
  const displayName = currentUser?.name ?? '';
  const alertCount = 0;

  /** Prevent background scroll when the mobile menu is open. */
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  /** Shared className for items in the mobile drawer. */
  const menuLink = 'block w-full text-left px-4 py-2 hover:underline transition';

  return (
    <header className="sticky top-0 z-50 bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]">
      <div className="container flex items-center py-3">
        <Link to="/" className="text-lg font-bold">
          Holidaze
        </Link>

        {/* Desktop nav + auth */}
        <div className="hidden sm:flex items-center gap-6 ml-auto">
          <nav className="flex items-center gap-6 text-lg font-medium" aria-label="Primary">
            <NavLink to="/" className={link}>
              Home
            </NavLink>

            {isLoggedIn && (
              <>
                <NavLink to="/profile" className={link}>
                  Profile
                </NavLink>
                <NavLink to="/bookings" className={link}>
                  My bookings
                </NavLink>
                {isManager && (
                  <NavLink to="/manage" className={link}>
                    Manage venues
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {!isLoggedIn ? (
            <>
              <NavLink to="/login" className={link}>
                Login
              </NavLink>
              <NavLink to="/register" className={link}>
                Register
              </NavLink>
            </>
          ) : (
            <LogoutButton />
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden relative ml-auto h-12 w-12 p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          {/* open icon */}
          <svg
            className={`h-8 w-8 transform transition-all duration-300 ${
              menuOpen ? 'scale-75 opacity-0' : 'scale-125 opacity-100'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          {/* close icon */}
          <svg
            className={`h-8 w-8 transform transition-all duration-300 ${
              menuOpen ? 'scale-125 opacity-100' : 'scale-90 opacity-0'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>

          {isLoggedIn && alertCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-on-danger">
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop info row: right-aligned. Shows Theme always; "Logged in as" only when logged in */}
      <div className="container mt-1 hidden sm:flex items-center justify-end gap-3 text-sm text-[rgb(var(--header-fg))]">
        {isLoggedIn && displayName && (
          <span>
            Logged in as <span className="font-semibold">{displayName}</span>
            <span className="ml-2 text-[rgb(var(--header-fg))/0.95]">
              ({isManager ? 'Manager' : 'Customer'})
            </span>
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[rgb(var(--header-fg))]">Theme</span>
          <ThemeSwitcher variant="header" compact onChanged={() => setMenuOpen(false)} />
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block">
        <div className="container h-px w-full bg-[rgb(var(--header-fg))/35]" />
        <div className="h-px bg-[rgb(var(--header-fg))/12]" />
      </div>

      <MobileMenuPortal open={menuOpen} onClose={() => setMenuOpen(false)}>
        {/* header row inside the drawer */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--header-fg))/30] px-4 pb-4 pt-6">
          <h2 id="mobile-menu-title" className="text-lg font-semibold">
            Menu
          </h2>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* the list */}
        <ul className="flex flex-col gap-4 p-4">
          <li>
            <NavLink to="/" onClick={() => setMenuOpen(false)} className={menuLink}>
              Home
            </NavLink>
          </li>

          {isLoggedIn && (
            <>
              <li>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={menuLink}>
                  Profile
                  {alertCount > 0 && (
                    <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-on-danger">
                      {alertCount}
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/bookings" onClick={() => setMenuOpen(false)} className={menuLink}>
                  My bookings
                </NavLink>
              </li>
            </>
          )}

          {isManager && (
            <li>
              <NavLink to="/manage" onClick={() => setMenuOpen(false)} className={menuLink}>
                Manage venues
              </NavLink>
            </li>
          )}

          {!isLoggedIn ? (
            <>
              <li>
                <NavLink to="/login" onClick={() => setMenuOpen(false)} className={menuLink}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" onClick={() => setMenuOpen(false)} className={menuLink}>
                  Register
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <LogoutButton className={menuLink} />
            </li>
          )}

          <li
            role="separator"
            aria-hidden="true"
            className="my-4 border-t border-[rgb(var(--header-fg))/20]"
          />

          <li>
            <div className="text-sm text-[rgb(var(--header-fg))]">
              <span className="block mb-1">Theme</span>
              <ThemeSwitcher variant="header" compact onChanged={() => setMenuOpen(false)} />
            </div>
          </li>
        </ul>
      </MobileMenuPortal>
    </header>
  );
}
