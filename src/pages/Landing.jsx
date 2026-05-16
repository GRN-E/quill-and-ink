import { PenTool, Sparkles, Download, Cloud, Zap, Heart, Star, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useLang } from '../i18n';

export default function Landing({ session }) {
  const { t } = useLang();

  const features = [
    { Icon: PenTool, title: t('feat_1_title'), desc: t('feat_1_desc') },
    { Icon: Cloud, title: t('feat_2_title'), desc: t('feat_2_desc') },
    { Icon: Zap, title: t('feat_3_title'), desc: t('feat_3_desc') },
    { Icon: Sparkles, title: t('feat_4_title'), desc: t('feat_4_desc') },
    { Icon: Download, title: t('feat_5_title'), desc: t('feat_5_desc') },
    { Icon: Heart, title: t('feat_6_title'), desc: t('feat_6_desc') },
  ];

  const steps = [
    { number: '01', title: t('how_1_title'), desc: t('how_1_desc') },
    { number: '02', title: t('how_2_title'), desc: t('how_2_desc') },
    { number: '03', title: t('how_3_title'), desc: t('how_3_desc') },
  ];

  const testimonials = [
    {
      quote: t('feat_6_desc'),
      name: 'Anonymous',
      role: t('plan_free_tagline'),
    },
    {
      quote: t('hero_subtitle'),
      name: 'Anonymous',
      role: t('plan_pro_tagline'),
    },
    {
      quote: t('about_subtitle'),
      name: 'Anonymous',
      role: t('plan_team_tagline'),
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        {/* HERO */}
        <section className="container-prose pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <Sparkles size={12} />
              <span>{t('hero_badge')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink-950 mb-6">
              {t('hero_title_1')}
              <br />
              <span className="text-brand-600">{t('hero_title_2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-ink-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                to={session ? '/app' : '/signup'}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                {session ? t('hero_cta_open') : t('hero_cta_primary')}
              </Button>
              <Button to="/pricing" variant="ghost" size="lg">
                {t('hero_cta_secondary')}
              </Button>
            </div>
            <p className="mt-6 text-xs text-ink-500">{t('hero_microtrust')}</p>
          </div>

          <div className="mt-16 md:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-ink-200 shadow-floating bg-white">
              <div className="aspect-[16/9] bg-gradient-to-br from-brand-50 via-white to-ink-50 flex items-center justify-center p-8">
                <div className="text-center">
                  <PenTool size={48} className="mx-auto mb-4 text-brand-600" />
                  <p className="text-ink-500 text-sm italic">{t('hero_mockup')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="container-prose py-20 md:py-28 border-t border-ink-100">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
              {t('features_kicker')}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
              {t('features_title')}
            </h2>
            <p className="text-lg text-ink-600">{t('features_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white border border-ink-200 hover:border-ink-300 hover:shadow-elevated transition-base"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-600 mb-4">
                  <f.Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-ink-950 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                {t('how_kicker')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                {t('how_title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="text-5xl md:text-6xl font-bold text-brand-200 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-ink-950 mb-3">{step.title}</h3>
                  <p className="text-ink-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="container-prose py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-brand-500 text-brand-500" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
              {t('test_title')}
            </h2>
            <p className="text-lg text-ink-600">{t('test_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((tm, i) => (
              <div key={i} className="p-6 rounded-xl bg-white border border-ink-200 shadow-card">
                <p className="text-ink-800 leading-relaxed mb-5 italic">"{tm.quote}"</p>
                <div className="pt-5 border-t border-ink-100">
                  <p className="text-sm font-semibold text-ink-950">{tm.name}</p>
                  <p className="text-xs text-ink-500">{tm.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="container-prose pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 text-white py-16 md:py-20 px-8 md:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-transparent" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {t('cta_title')}
              </h2>
              <p className="text-lg text-ink-300 mb-8 max-w-xl">{t('cta_subtitle')}</p>
              <Button
                to={session ? '/app' : '/signup'}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                {session ? t('cta_button_open') : t('cta_button')}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
