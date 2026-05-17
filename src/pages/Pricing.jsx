import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useLang } from '../i18n';
import { usePlan } from '../PlanContext';
import { getPlan } from '../planLimits';

export default function Pricing({ session }) {
  const { t } = useLang();
  const { plan } = usePlan();

  const free = getPlan('free');
  const golden = getPlan('golden');
  const sub = (str, n) => str.replace('{n}', String(n));

  const freeFeatures = [
    { ok: true, text: sub(t('pr_f_docs'), free.maxDocuments) },
    { ok: true, text: sub(t('pr_f_pages'), free.maxPagesPerDoc) },
    { ok: true, text: t('pr_f_templates_basic') },
    { ok: true, text: t('pr_f_png_ad') },
    { ok: false, text: t('pr_f_pdf') },
    { ok: false, text: t('pr_f_header') },
    { ok: false, text: t('pr_f_nowm') },
    { ok: false, text: t('pr_f_noads') },
  ];
  const goldenFeatures = [
    { ok: true, text: sub(t('pr_f_docs'), golden.maxDocuments) },
    { ok: true, text: sub(t('pr_f_pages'), golden.maxPagesPerDoc) },
    { ok: true, text: t('pr_f_templates_all') },
    { ok: true, text: t('pr_f_png_free') },
    { ok: true, text: t('pr_f_pdf') },
    { ok: true, text: t('pr_f_header') },
    { ok: true, text: t('pr_f_nowm') },
    { ok: true, text: t('pr_f_noads') },
  ];

  const isFree = plan === 'free';
  const isGolden = plan === 'golden';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        <section className="container-prose pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-2xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <Sparkles size={12} />
              <span>Inkly</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-950 mb-5">
              {t('pr_title')}
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">{t('pr_subtitle')}</p>
          </div>
        </section>

        <section className="container-prose pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

            <div className="relative rounded-2xl p-8 flex flex-col bg-white text-ink-950 border border-ink-200 shadow-card">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-ink-950">{t('pr_free_name')}</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-bold tracking-tight text-ink-950">{t('pr_free_price')}</span>
                <span className="text-sm text-ink-500">{t('pr_free_period')}</span>
              </div>
              <div className="mb-8">
                {isFree ? (
                  <Button variant="secondary" size="md" fullWidth disabled>
                    {t('pr_cta_free_current')}
                  </Button>
                ) : (
                  <Button to={session ? '/app' : '/signup'} variant="secondary" size="md" fullWidth>
                    {t('pr_cta_free_start')}
                  </Button>
                )}
              </div>
              <ul className="space-y-3 flex-1">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    {f.ok
                      ? <Check size={16} className="flex-shrink-0 mt-0.5 text-brand-600" />
                      : <X size={16} className="flex-shrink-0 mt-0.5 text-ink-300" />}
                    <span className={`text-sm ${f.ok ? 'text-ink-700' : 'text-ink-400 line-through'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl p-8 flex flex-col bg-ink-950 text-white shadow-floating ring-1 ring-ink-950">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold shadow-card">
                  {t('pr_golden_badge')}
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">{t('pr_golden_name')}</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-bold tracking-tight text-white">{t('pr_golden_price')}</span>
                <span className="text-sm text-ink-400">{t('pr_golden_period')}</span>
              </div>
              <div className="mb-8">
                {isGolden ? (
                  <Button variant="primary" size="md" fullWidth disabled>
                    {t('pr_cta_free_current')}
                  </Button>
                ) : (
                  <Button to="/upgrade" variant="primary" size="md" fullWidth rightIcon={<ArrowRight size={14} />}>
                    {t('pr_cta_golden')}
                  </Button>
                )}
              </div>
              <ul className="space-y-3 flex-1">
                {goldenFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check size={16} className="flex-shrink-0 mt-0.5 text-brand-400" />
                    <span className="text-sm text-ink-200">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
