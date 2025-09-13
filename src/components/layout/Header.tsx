import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import LogoutButton from '@/components/auth/LogoutButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAuthStore } from '@/store/authStore';

const link = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1 rounded ${isActive ? 'underline' : 'hover:underline'}`;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const role = useAuthStore((s) => s.role());
  const isManager = role === 'manager';
  const displayName = currentUser?.name ?? '';
  const alertCount = 0;

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  const menuLink = 'block w-full text-left px-4 py-2 hover:underline transition';

  return (
    <header className="sticky top-0 z-50 bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]">
      <div className="container flex items-center py-3">
        {/* Brand (left) */}
        <Link to="/" className="text-lg font-bold">
          Holidaze
        </Link>

        {/* Right side (nav + auth) */}
        <div className="hidden sm:flex items-center gap-6 ml-auto">
          <nav className="flex items-center gap-6 text-lg font-medium">
            <NavLink to="/" className={link}>
              Home
            </NavLink>
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
          </nav>

          {/* Auth actions (optional keep here so they’re also right-aligned) */}
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

        {/* Hamburger (mobile) */}
        <button
          className="sm:hidden relative ml-auto h-12 w-12 p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {/* open */}
          <svg
            className={`h-8 w-8 transform transition-all duration-300 ${menuOpen ? 'scale-75 opacity-0' : 'scale-125 opacity-100'}`}
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
          {/* close */}
          <svg
            className={`h-8 w-8 transform transition-all duration-300 ${menuOpen ? 'scale-125 opacity-100' : 'scale-90 opacity-0'}`}
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

      {/* Desktop "logged in as" row */}
      {isLoggedIn && displayName && (
        <div className="container mt-1 hidden sm:flex items-center justify-end gap-3 text-sm opacity-80">
          <span>
            Logged in as <span className="font-semibold">{displayName}</span>
            <span className="ml-2 opacity-70">({isManager ? 'Manager' : 'Customer'})</span>
          </span>

          {/* label is visible because compact is omitted */}
          <ThemeSwitcher variant="header" className="ml-2" />
        </div>
      )}
      <div className="hidden sm:block">
        <div className="container h-px w-full bg-[rgb(var(--header-fg))/35]" />
        <div className="h-px bg-[rgb(var(--header-fg))/12]" />
      </div>
      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`fixed right-0 top-0 z-50 h-full w-full transform
              bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]
              shadow-lg transition-transform duration-300 sm:hidden
              ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[rgb(var(--header-fg))/30] px-4 pb-4 pt-6">
          <span className="text-lg font-semibold">Menu</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
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
        </div>

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

          <hr className="my-4 border-[rgb(var(--header-fg))/20]" />

          {isLoggedIn ? (
            <div className="space-y-3 text-sm">
              <div className="opacity-90">
                Logged in as <strong>{displayName}</strong>
                {isManager && <span className="opacity-70"> (Manager)</span>}
              </div>

              <div>
                <span className="block mb-1 opacity-80">Theme</span>
                <ThemeSwitcher variant="header" compact onChanged={() => setMenuOpen(false)} />
              </div>

              <LogoutButton className="underline" />
            </div>
          ) : (
            <div className="text-sm">
              <span className="block mb-1 opacity-80">Theme</span>
              <ThemeSwitcher variant="header" compact onChanged={() => setMenuOpen(false)} />
            </div>
          )}
        </ul>
      </div>
    </header>
  );
}
