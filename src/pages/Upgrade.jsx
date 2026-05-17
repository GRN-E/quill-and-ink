import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLang } from '../i18n';

// ─────────────────────────────────────────────────────────────
// /upgrade — PLACEHOLDER ONLY. No real payment is processed.
// TODO: Integrate a real payment provider here later
// (QPay / SocialPay / card). On successful payment, set the
// user's profiles.plan to 'golden' from a trusted server action.
// ─────────────────────────────────────────────────────────────
export default function Upgrade({ session }) {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1 container-prose py-24">
        <div className="max-w-xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
            <Sparkles size={12} />
            <span>{t('pr_golden_name')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">{t('up_title')}</h1>
          <p className="text-lg text-ink-600 mb-8">{t('up_body')}</p>

          <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50 p-6 text-sm text-ink-500">
            {t('up_soon')}
          </div>

          <div className="mt-8">
            <Link
              to="/pricing"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-base"
            >
              {t('up_back')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
