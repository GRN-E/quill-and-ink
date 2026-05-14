import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './supabase';
import Auth from './Auth';
import QuillAndInk from './QuillAndInk';

// Hook that tracks whether the user is logged in
function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

// Wrapper that only allows access if logged in
function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// Loading screen shown briefly while checking session
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-ink-400 text-sm">Loading…</div>
    </div>
  );
}

// Temporary placeholder pages — we'll build these properly in Stages B and C
function PlaceholderPage({ title, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-3xl font-bold text-ink-950 mb-2">{title}</h1>
        <p className="text-ink-600 mb-8">{message}</p>
        <Link to="/" className="text-brand-600 hover:text-brand-700 font-medium">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

function LandingPlaceholder({ session }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-5xl font-bold text-ink-950 mb-4 tracking-tight">Inkly</h1>
        <p className="text-lg text-ink-600 mb-8">
          Transform your handwriting into a font.
        </p>
        <div className="flex items-center justify-center gap-3">
          {session ? (
            <Link
              to="/app"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-base shadow-card"
            >
              Open the app
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-base shadow-card"
              >
                Get started free
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 text-ink-700 rounded-lg font-medium hover:bg-ink-50 transition-base"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
        <p className="text-xs text-ink-400 mt-12">
          Marketing site coming soon — currently using a placeholder
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { session, loading } = useSession();

  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPlaceholder session={session} />} />
        <Route
          path="/pricing"
          element={<PlaceholderPage title="Pricing" message="Pricing page coming in Stage B." />}
        />
        <Route
          path="/about"
          element={<PlaceholderPage title="About" message="About page coming in Stage B." />}
        />

        {/* Auth pages */}
        <Route
          path="/login"
          element={session ? <Navigate to="/app" replace /> : <Auth />}
        />
        <Route
          path="/signup"
          element={session ? <Navigate to="/app" replace /> : <Auth />}
        />

        {/* Protected app */}
        <Route
          path="/app"
          element={
            <ProtectedRoute session={session}>
              <QuillAndInk session={session} />
            </ProtectedRoute>
          }
        />

        {/* Fallback — anything else redirects home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
