import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';

// Public site header — appears on landing, pricing, about pages
// Props:
//   - session: current Supabase session (null if logged out)
export default function Header({ session }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Track scroll position to add subtle shadow when scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
  ];

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-base ${
      isActive
        ? 'text-ink-950'
        : 'text-ink-600 hover:text-ink-950'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 bg-white/85 backdrop-blur-md transition-base ${
        scrolled ? 'border-b border-ink-200' : 'border-b border-transparent'
      }`}
    >
      <div className="container-prose">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <Button to="/app" variant="primary" size="sm">
                Open app
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button to="/signup" variant="primary" size="sm">
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-md text-ink-700 hover:bg-ink-100 transition-base"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu (expands when hamburger tapped) */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-ink-200 -mx-6 px-6 animate-fade-in">
            <nav className="flex flex-col gap-1 pb-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-base ${
                      isActive
                        ? 'bg-ink-100 text-ink-950'
                        : 'text-ink-700 hover:bg-ink-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-ink-200">
              {session ? (
                <Button to="/app" variant="primary" fullWidth>
                  Open app
                </Button>
              ) : (
                <>
                  <Button to="/login" variant="secondary" fullWidth>
                    Sign in
                  </Button>
                  <Button to="/signup" variant="primary" fullWidth>
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
