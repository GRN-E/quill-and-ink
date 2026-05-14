import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Auth from './Auth';
import QuillAndInk from './QuillAndInk';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import About from './pages/About';

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

export default function App() {
  const { session, loading } = useSession();

  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing pages */}
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/pricing" element={<Pricing session={session} />} />
        <Route path="/about" element={<About session={session} />} />

        {/* Auth pages — redirect to /app if already signed in */}
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

        {/* Fallback — anything else redirects to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
