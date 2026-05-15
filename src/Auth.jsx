import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from './supabase';
import Logo from './components/Logo';
import Button from './components/Button';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from URL path
  const initialMode = location.pathname === '/signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessage(null);
    navigate(newMode === 'signup' ? '/signup' : '/login', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email, password });
        if (result.error) throw result.error;
        setMessage({
          type: 'ok',
          text: 'Check your email — we sent a confirmation link.',
        });
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        // On success, App.jsx automatically redirects to /app via the session listener
      }
    } catch (err) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar with back link */}
      <header className="container-prose pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950 transition-base"
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo above the form */}
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <Logo size="lg" linkTo={null} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-950 mb-2 tracking-tight">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-ink-600">
              {isSignup
                ? 'Start drawing your font in under a minute.'
                : 'Sign in to continue with your alphabet.'}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm text-ink-950 bg-white border border-ink-200 rounded-lg placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                  />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm text-ink-950 bg-white border border-ink-200 rounded-lg placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base outline-none"
                    placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  />
                </div>
                {isSignup && (
                  <p className="mt-2 text-xs text-ink-500">
                    Minimum 6 characters.
                  </p>
                )}
              </div>

              {/* Message banner — success or error */}
              {message && (
                <div
                  className={
                    message.type === 'ok'
                      ? 'flex items-start gap-2.5 p-3 rounded-lg bg-brand-50 border border-brand-100'
                      : 'flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100'
                  }
                >
                  {message.type === 'ok' ? (
                    <CheckCircle2
                      size={16}
                      className="flex-shrink-0 mt-0.5 text-brand-600"
                    />
                  ) : (
                    <AlertCircle
                      size={16}
                      className="flex-shrink-0 mt-0.5 text-red-600"
                    />
                  )}
                  <p
                    className={
                      message.type === 'ok'
                        ? 'text-sm text-brand-900 leading-relaxed'
                        : 'text-sm text-red-900 leading-relaxed'
                    }
                  >
                    {message.text}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={busy}
                rightIcon={busy ? null : <ArrowRight size={14} />}
              >
                {busy
                  ? 'Working…'
                  : isSignup
                  ? 'Create account'
                  : 'Sign in'}
              </Button>
            </form>

            {/* Mode toggle */}
            <div className="mt-6 pt-6 border-t border-ink-100 text-center text-sm">
              {isSignup ? (
                <span className="text-ink-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-brand-600 hover:text-brand-700 transition-base"
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span className="text-ink-600">
                  New to Inkly?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-brand-600 hover:text-brand-700 transition-base"
                  >
                    Create an account
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Footer micro-text */}
          <p className="mt-6 text-center text-xs text-ink-500 leading-relaxed">
            By {isSignup ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-ink-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-ink-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
