import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import LogoutButton from '@/components/auth/LogoutButton';
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

  // TODO: connect to a future store if/when you have alerts
  const alertCount = 0;

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  const menuLink = 'block w-full text-left px-4 py-2 hover:underline transition';

  return (
    <header className="bg-header text-white px-4 py-4 shadow-md sticky top-0 z-50">
      <div className="relative container mx-auto flex w-full items-center justify-between">
        {/* Logo (swap text for <img …> when you add one) */}
        <div className="hidden sm:block">
          <Link to="/" className="group flex items-center text-lg font-bold">
            Holidaze
          </Link>
        </div>

        {/* Centered logo on small screens */}
        <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
          <Link to="/" className="text-lg font-bold">
            Holidaze
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="sm:hidden relative ml-auto h-12 w-12 p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {/* open icon */}
          <svg
            className={`h-8 w-8 transform text-white transition-all duration-300 ${
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
            className={`h-8 w-8 transform text-white transition-all duration-300 ${
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
            <span className="absolute -right-1 -top-1 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 pr-2 text-lg font-medium sm:flex">
          <NavLink to="/" className={link}>
            Home
          </NavLink>

          {isLoggedIn && (
            <>
              <NavLink to="/profile" className={link}>
                Profile
                {alertCount > 0 && (
                  <span className="ml-2 -translate-y-1 inline-flex rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/bookings" className={link}>
                My bookings
              </NavLink>
            </>
          )}

          {isManager && (
            <>
              <NavLink to="/manage" className={link}>
                Manage venues
              </NavLink>
              <NavLink to="/venues/new" className={link}>
                New venue
              </NavLink>
            </>
          )}

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
        </nav>
      </div>

      {/* Logged-in hint (desktop only) */}
      {isLoggedIn && displayName && (
        <div className="container mt-1 hidden justify-end text-sm text-white/70 sm:flex">
          Logged in as <span className="ml-1 font-semibold">{displayName}</span>
          <span className="ml-2 opacity-70">({isManager ? 'Manager' : 'Customer'})</span>
        </div>
      )}

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed right-0 top-0 z-50 h-full w-full transform bg-header text-white shadow-lg transition-transform duration-300 sm:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white px-4 pb-4 pt-6">
          <span className="text-lg font-semibold">Menu</span>
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
                    <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
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
            <>
              <li>
                <NavLink to="/manage" onClick={() => setMenuOpen(false)} className={menuLink}>
                  Manage venues
                </NavLink>
              </li>
              <li>
                <NavLink to="/venues/new" onClick={() => setMenuOpen(false)} className={menuLink}>
                  New venue
                </NavLink>
              </li>
            </>
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

          {isLoggedIn && displayName && (
            <li className="pt-2 text-sm text-gray-300">
              Logged in as <span className="font-semibold">{displayName}</span>{' '}
              <span className="opacity-70">({isManager ? 'Manager' : 'Customer'})</span>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
