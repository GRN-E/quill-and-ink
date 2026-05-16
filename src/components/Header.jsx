import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Languages } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import { useLang } from '../i18n';

export default function Header({ session }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, toggle, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: t('nav_home'), end: true },
    { to: '/pricing', label: t('nav_pricing') },
    { to: '/about', label: t('nav_about') },
  ];

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-base ${
      isActive ? 'text-ink-950' : 'text-ink-600 hover:text-ink-950'
    }`;

  // Language toggle button — shows the OTHER language as the action
  const LangToggle = ({ full }) => (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-ink-200 hover:bg-ink-50 transition-base font-semibold text-ink-700 ${
        full ? 'w-full justify-center py-2 text-sm' : 'px-2.5 py-1.5 text-xs'
      }`}
      aria-label="Toggle language"
    >
      <Languages size={14} />
      <span>{lang === 'mn' ? 'EN' : 'МН'}</span>
    </button>
  );

  return (
    <header
      className={`sticky top-0 z-40 bg-white/85 backdrop-blur-md transition-base ${
        scrolled ? 'border-b border-ink-200' : 'border-b border-transparent'
      }`}
    >
      <div className="container-prose">
        <div className="flex h-16 items-center justify-between">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LangToggle />
            {session ? (
              <Button to="/app" variant="primary" size="sm">
                {t('nav_openapp')}
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  {t('nav_signin')}
                </Button>
                <Button to="/signup" variant="primary" size="sm">
                  {t('nav_getstarted')}
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-md text-ink-700 hover:bg-ink-100 transition-base"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

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
                      isActive ? 'bg-ink-100 text-ink-950' : 'text-ink-700 hover:bg-ink-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-ink-200">
              <LangToggle full />
              {session ? (
                <Button to="/app" variant="primary" fullWidth>
                  {t('nav_openapp')}
                </Button>
              ) : (
                <>
                  <Button to="/login" variant="secondary" fullWidth>
                    {t('nav_signin')}
                  </Button>
                  <Button to="/signup" variant="primary" fullWidth>
                    {t('nav_getstarted')}
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
