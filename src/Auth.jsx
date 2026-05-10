import React, { useState } from 'react';
import { Feather, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from './supabase';

const C = {
  parchment: '#f4ecd8',
  parchmentDark: '#ece3c6',
  ink: '#3b2f2f',
  inkSoft: 'rgba(59, 47, 47, 0.6)',
  brass: '#b5a642',
  brassDark: '#8a7d2e',
};

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'ok', text: 'Check your email for the confirmation link.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: C.parchment, fontFamily: '"Playfair Display", Georgia, serif' }}>
      <div className="w-full max-w-sm rounded-lg shadow-2xl p-6"
        style={{ background: C.parchmentDark, border: `2px dashed ${C.brass}66` }}>
        <div className="text-center mb-6">
          <Feather size={36} className="mx-auto mb-2" style={{ color: C.brass }} />
          <h1 className="text-2xl font-bold tracking-widest uppercase" style={{ color: C.ink }}>
            Inkly
          </h1>
          <p className="text-xs italic mt-1" style={{ color: C.brassDark }}>
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1"
              style={{ color: C.brassDark }}>
              <Mail size={12} /> Email
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded outline-none"
              style={{ background: C.parchment, border: `1px solid ${C.brass}55`, color: C.ink }}
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1"
              style={{ color: C.brassDark }}>
              <Lock size={12} /> Password
            </label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded outline-none"
              style={{ background: C.parchment, border: `1px solid ${C.brass}55`, color: C.ink }}
              placeholder="At least 6 characters" />
          </div>

          {message && (
            <div className="text-xs italic px-3 py-2 rounded"
              style={{
                background: message.type === 'ok' ? 'rgba(181,166,66,0.15)' : 'rgba(160, 82, 64, 0.1)',
                color: message.type === 'ok' ? C.brassDark : '#80322f',
                border: `1px solid ${message.type === 'ok' ? C.brass : '#a0524066'}`,
              }}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full py-2.5 rounded font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: C.brass, color: C.parchment }}>
            {mode === 'signin' ? <LogIn size={14} /> : <UserPlus size={14} />}
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs italic" style={{ color: C.inkSoft }}>
          {mode === 'signin' ? (
            <>Don't have an account?{' '}
              <button type="button" onClick={() => { setMode('signup'); setMessage(null); }}
                className="underline" style={{ color: C.brassDark }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => { setMode('signin'); setMessage(null); }}
                className="underline" style={{ color: C.brassDark }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
