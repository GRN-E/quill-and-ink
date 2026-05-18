import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../i18n';
import { usePlan } from '../PlanContext';
import { getPlan } from '../planLimits';
import Logo from '../components/Logo';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-100 last:border-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-950">{value}</span>
    </div>
  );
}

export default function Account({ session }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { plan, profile, refreshPlan } = usePlan();
  const conf = getPlan(plan);
  const [docCount, setDocCount] = useState(null);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      if (!cancelled) setDocCount(count || 0);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const adsToday =
    profile && profile.ad_unlocks_date === todayStr ? (profile.ad_unlocks_count || 0) : 0;
  const isFree = plan === 'free';
  const fmtDate = (s) => {
    try { return new Date(s).toLocaleDateString(); } catch (e) { return '—'; }
  };

  // DEV ONLY — hidden in production (import.meta.env.DEV is false on Vercel).
  // TODO: real plan changes must come from a trusted server action after payment.
  const setDevPlan = async (next) => {
    if (!session?.user) return;
    await supabase.from('profiles')
      .update({ plan: next, updated_at: new Date().toISOString() })
      .eq('user_id', session.user.id);
    if (refreshPlan) refreshPlan();
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-ink-200">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-3xl mx-auto">
          <Logo size="sm" linkTo={null} />
          <Link to="/app" className="text-sm font-medium text-ink-700 hover:text-ink-950 transition-base">
            {t('acc_open_app')}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-ink-950 tracking-tight">{t('acc_title')}</h1>

        <section className="rounded-2xl bg-white border border-ink-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">{t('acc_plan')}</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              isFree ? 'bg-ink-100 text-ink-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {isFree ? t('pr_free_name') : t('pr_golden_name')}
            </span>
            {isFree && (
              <button onClick={() => navigate('/upgrade')}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-card transition-base">
                {t('acc_upgrade_btn')}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-ink-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">{t('acc_usage')}</p>
          <Row label={t('acc_docs_used')} value={`${docCount === null ? '…' : docCount} / ${conf.maxDocuments}`} />
          {isFree && (
            <Row label={t('acc_ads_today')} value={`${adsToday} / ${conf.maxAdUnlocksPerDay}`} />
          )}
        </section>

        <section className="rounded-2xl bg-white border border-ink-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">{t('acc_profile')}</p>
          <Row label={t('acc_email')} value={session?.user?.email || '—'} />
          <Row label={t('acc_member_since')} value={fmtDate(session?.user?.created_at)} />
        </section>

        <section className="rounded-2xl bg-white border border-dashed border-ink-300 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">{t('acc_billing')}</p>
          <p className="text-sm text-ink-500">{t('acc_billing_soon')}</p>
        </section>

        {import.meta.env.DEV && (
          <section className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">DEV ONLY — testing</p>
            <p className="text-sm text-amber-800 mb-3">Hidden in production. Switch plan to test gating locally.</p>
            <div className="flex gap-2">
              <button onClick={() => setDevPlan('free')}
                className="px-4 py-2 rounded-lg bg-white border border-amber-200 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-base">
                Set Free
              </button>
              <button onClick={() => setDevPlan('golden')}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-base">
                Set Golden
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
