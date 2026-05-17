import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { LanguageProvider } from './i18n';
import { PlanProvider, usePlan } from './PlanContext';
import Auth from './Auth';
import QuillAndInk from './QuillAndInk';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Upgrade from './pages/Upgrade';
import About from './pages/About';

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

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-ink-400 text-sm">Loading…</div>
    </div>
  );
}

// TEMPORARY debug badge — shows the detected plan. Removed in the final cleanup stage.
function PlanDebugBadge() {
  const { plan, planLoading } = usePlan();
  return (
    <div style={{
      position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
      background: '#0a0a0a', color: '#fff', fontSize: 11,
      padding: '4px 8px', borderRadius: 6, fontFamily: 'monospace',
      opacity: 0.7, pointerEvents: 'none',
    }}>
      plan: {planLoading ? '…' : plan}
    </div>
  );
}

export default function App() {
  const { session, loading } = useSession();

  if (loading) return <LoadingScreen />;

  return (
    <LanguageProvider>
      <PlanProvider session={session}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing session={session} />} />
            <Route path="/pricing" element={<Pricing session={session} />} />
            <Route path="/upgrade" element={<Upgrade session={session} />} />
            <Route path="/about" element={<About session={session} />} />
            <Route
              path="/login"
              element={session ? <Navigate to="/app" replace /> : <Auth />}
            />
            <Route
              path="/signup"
              element={session ? <Navigate to="/app" replace /> : <Auth />}
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute session={session}>
                  <QuillAndInk session={session} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <PlanDebugBadge />
      </PlanProvider>
    </LanguageProvider>
  );
}
