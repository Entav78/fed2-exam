import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
// import ThemeToggle from "@/components/ui/ThemeToggle"; // enable when you copy it over
// import logo from "@/assets/img/holidaze-logo.png";      // add your logo later

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // TODO: wire to your auth store later
  const isLoggedIn = false;
  const userName = '';
  // TODO: wire to a bookings/adoption-like store for alerts later
  const alertCount = 0;

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  const menuLink = 'block w-full text-left px-4 py-2 hover:underline transition';

  return (
    <header className="bg-header text-white px-4 py-4 shadow-md sticky top-0 z-50">
      <div className="relative flex items-center justify-between w-full container mx-auto">
        {/* Logo (swap text for <img src={logo} .../> when ready) */}
        <div className="hidden sm:block">
          <Link to="/" className="group flex items-center text-lg font-bold">
            Holidaze
          </Link>
        </div>

        {/* Centered logo on small screens (text for now) */}
        <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
          <Link to="/" className="text-lg font-bold">
            Holidaze
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="sm:hidden relative w-12 h-12 p-2 ml-auto"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <svg
            className={`w-8 h-8 text-white transform transition-all duration-300 ${
              menuOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-125'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            className={`w-8 h-8 text-white transform transition-all duration-300 ${
              menuOpen ? 'opacity-100 scale-125' : 'opacity-0 scale-90'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>

          {isLoggedIn && alertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alertCount}
            </span>
          )}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex gap-6 text-lg font-medium items-center pr-2">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'underline' : 'hover:underline')}
          >
            Home
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `relative ${isActive ? 'underline' : 'hover:underline'}`}
          >
            Profile
            {isLoggedIn && alertCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/admin/venues"
            className={({ isActive }) => (isActive ? 'underline' : 'hover:underline')}
          >
            Admin
          </NavLink>

          {/* <ThemeToggle /> */}

          {isLoggedIn ? (
            <button className="hover:underline">Logout</button>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'underline' : 'hover:underline')}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'underline' : 'hover:underline')}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Logged-in hint (desktop) */}
      {isLoggedIn && userName && (
        <div className="hidden sm:flex justify-end text-sm text-white/70 mt-1 container">
          Logged in as <span className="font-semibold ml-1">{userName}</span>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-full bg-header text-white shadow-lg transform transition-transform duration-300 z-50 sm:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center px-4 pt-6 pb-4 border-b border-white">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <li>
            <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={menuLink}>
              Profile
              {isLoggedIn && alertCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/venues" onClick={() => setMenuOpen(false)} className={menuLink}>
              Admin
            </NavLink>
          </li>

          {isLoggedIn ? (
            <li>
              <button onClick={() => setMenuOpen(false)} className={menuLink}>
                Logout
              </button>
            </li>
          ) : (
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
          )}

          {/* <li className="pt-4 border-t border-white">
            <ThemeToggle />
          </li> */}

          {isLoggedIn && userName && (
            <li className="pt-2 text-sm text-gray-300">
              Logged in as <span className="font-semibold">{userName}</span>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
