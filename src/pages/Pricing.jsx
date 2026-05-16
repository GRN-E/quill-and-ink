import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useLang } from '../i18n';

export default function Pricing({ session }) {
  const { t } = useLang();

  const plans = [
    {
      name: t('plan_free_name'),
      tagline: t('plan_free_tagline'),
      price: '$0',
      period: t('plan_free_period'),
      cta: session ? t('plan_cta_open') : t('plan_cta_free'),
      ctaTo: session ? '/app' : '/signup',
      ctaVariant: 'secondary',
      highlighted: false,
      features: [
        { ok: true, text: t('feat_1_title') },
        { ok: true, text: t('app_uppercase') + ', ' + t('app_lowercase') + ', ' + t('app_numbers') },
        { ok: true, text: t('feat_3_title') },
        { ok: true, text: t('feat_2_title') },
        { ok: true, text: t('feat_5_title') },
        { ok: false, text: 'TTF / OTF' },
        { ok: false, text: '5+ alphabets' },
        { ok: false, text: 'Priority support' },
      ],
    },
    {
      name: t('plan_pro_name'),
      tagline: t('plan_pro_tagline'),
      price: '$5',
      period: t('plan_pro_period'),
      cta: t('plan_cta_soon'),
      ctaTo: null,
      ctaVariant: 'primary',
      highlighted: true,
      badge: t('plan_pro_badge'),
      features: [
        { ok: true, text: t('plan_free_name') + ' +' },
        { ok: true, text: 'TTF font export' },
        { ok: true, text: '5 alphabets' },
        { ok: true, text: 'Punctuation' },
        { ok: true, text: 'HD exports' },
        { ok: true, text: 'Priority support' },
        { ok: true, text: 'Early features' },
        { ok: false, text: 'Team workspaces' },
      ],
    },
    {
      name: t('plan_team_name'),
      tagline: t('plan_team_tagline'),
      price: '$15',
      period: t('plan_team_period'),
      cta: t('plan_cta_contact'),
      ctaTo: '/contact',
      ctaVariant: 'secondary',
      highlighted: false,
      features: [
        { ok: true, text: t('plan_pro_name') + ' +' },
        { ok: true, text: 'Unlimited alphabets' },
        { ok: true, text: 'Team workspaces' },
        { ok: true, text: 'Central billing' },
        { ok: true, text: 'Admin controls' },
        { ok: true, text: 'SSO' },
        { ok: true, text: 'Dedicated support' },
        { ok: true, text: 'Training session' },
      ],
    },
  ];

  const faqs = [
    { q: t('faq_title'), a: t('pricing_subtitle') },
    { q: t('plan_pro_name'), a: t('about_subtitle') },
    { q: t('feat_2_title'), a: t('feat_2_desc') },
    { q: t('about_contact_title'), a: t('about_contact_desc') },
    { q: t('feat_6_title'), a: t('feat_6_desc') },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        <section className="container-prose pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-2xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <Sparkles size={12} />
              <span>{t('pricing_badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-950 mb-5">
              {t('pricing_title')}
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">{t('pricing_subtitle')}</p>
          </div>
        </section>

        <section className="container-prose pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-ink-950 text-white shadow-floating ring-1 ring-ink-950'
                    : 'bg-white text-ink-950 border border-ink-200 shadow-card'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold shadow-card">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-ink-950'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? 'text-ink-400' : 'text-ink-500'}`}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-5xl font-bold tracking-tight ${plan.highlighted ? 'text-white' : 'text-ink-950'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-ink-400' : 'text-ink-500'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  {plan.ctaTo ? (
                    <Button
                      to={plan.ctaTo}
                      variant={plan.highlighted ? 'primary' : plan.ctaVariant}
                      size="md"
                      fullWidth
                      rightIcon={<ArrowRight size={14} />}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? 'primary' : plan.ctaVariant}
                      size="md"
                      fullWidth
                      disabled
                    >
                      {plan.cta}
                    </Button>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {feature.ok ? (
                        <Check size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-brand-400' : 'text-brand-600'}`} />
                      ) : (
                        <X size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-ink-600' : 'text-ink-300'}`} />
                      )}
                      <span
                        className={`text-sm ${
                          feature.ok
                            ? plan.highlighted ? 'text-ink-200' : 'text-ink-700'
                            : plan.highlighted ? 'text-ink-500 line-through' : 'text-ink-400 line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                {t('faq_kicker')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                {t('faq_title')}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto grid gap-4">
              {faqs.map((item, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-ink-200 overflow-hidden shadow-subtle hover:shadow-card transition-base"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <span className="font-semibold text-ink-950 pr-4">{item.q}</span>
                    <span className="flex-shrink-0 text-ink-400 group-open:rotate-45 transition-transform duration-200 text-2xl leading-none">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 -mt-1 text-ink-600 leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="container-prose py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">{t('cta_title')}</h2>
            <p className="text-lg text-ink-600 mb-8">{t('cta_subtitle')}</p>
            <Button
              to={session ? '/app' : '/signup'}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
            >
              {session ? t('hero_cta_open') : t('cta_button')}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
