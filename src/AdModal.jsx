import React from 'react';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// FAKE rewarded-ad modal. PLACEHOLDER ONLY — shows no real ad.
// TODO: Replace the fake ad area + handleWatch() with a real
// rewarded-ad SDK (e.g. Google AdMob / AdSense rewarded) later.
// onReward() is the hook that grants the reward (e.g. +1 creation).
// ─────────────────────────────────────────────────────────────
export default function AdModal({ open, onClose, onReward, t }) {
  if (!open) return null;

  const handleWatch = () => {
    // TODO: real rewarded-ad completion callback goes here.
    onReward();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-floating overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-200">
          <p className="text-sm font-semibold text-ink-950">{t('app_ad_title')}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600 transition-base"
          >
            <X size={16} />
          </button>
        </div>

        {/* FAKE AD AREA — placeholder only. TODO: real ad unit here. */}
        <div className="m-5 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 h-40 flex flex-col items-center justify-center text-center px-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Ad</p>
          <p className="text-xs text-ink-500 mt-1">Placeholder — no real ad is shown.</p>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleWatch}
            className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-card transition-base"
          >
            {t('app_ad_watch')}
          </button>
        </div>
      </div>
    </div>
  );
}
