import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import QuillAndInk from './QuillAndInk';

export default function App() {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#f4ecd8', color: '#3b2f2f', fontFamily: 'Georgia, serif' }}>
        <p className="italic">Loading…</p>
      </div>
    );
  }

  if (!session) return <Auth />;
  return <QuillAndInk session={session} />;
}
