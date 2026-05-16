import { Heart, Code, Beaker, MapPin, ArrowRight, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useLang } from '../i18n';

export default function About({ session }) {
  const { t, lang } = useLang();

  // The founder story differs by language — keep it natural in each
  const story = lang === 'mn'
    ? [ 'Гараар бичсэн тэмдэглэлийн хуудас өөр мэдрэмж төрүүлдэг. Энэ нь бичсэн хүний дүр төрхийг агуулдаг. Бага зэрэг налуу, үсгийн гогцоо, үзэг чанга дарсан газар — эдгээр нь алдаа биш. Эдгээр нь оршихуй.',
        'Inkly бол үүнийг буцааж авчрах жижиг оролдлого. Цагаан толгойгоо нэг удаа зур. Хаа ч бич. Өөрийн чинь дүр төрхтэй уншигдах болно.',
        '— Эрмүүн, үүсгэн байгуулагч',
      ]
    : [  'A page of handwritten notes feels different. It carries a trace of who wrote it. The slight slant, the loop of an l, the place where the pen pressed harder — these are not flaws. They are presence.',
        'Inkly is a small attempt to bring that back. Draw your alphabet once. Type anywhere. Read what looks like you.',
        '— Ermuun, founder',
      ];

  const values = [
    { Icon: Heart, title: t('about_values_kicker'), desc: t('feat_6_desc') },
    { Icon: Code, title: t('footer_legal'), desc: t('pricing_subtitle') },
    { Icon: Beaker, title: t('about_values_title'), desc: t('about_subtitle') },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        <section className="container-prose pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <MapPin size={12} />
              <span>{t('about_badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-950 mb-6">
              {t('about_title_1')}
              <br />
              {t('about_title_2')}
            </h1>
            <p className="text-lg md:text-xl text-ink-600 leading-relaxed">
              {t('about_subtitle')}
            </p>
          </div>
        </section>

        <section className="container-prose py-12 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6 text-ink-700 leading-relaxed">
              {story.map((para, i) => {
                const isLast = i === story.length - 1;
                return (
                  <p
                    key={i}
                    className={
                      isLast
                        ? 'text-ink-500 italic pt-4 border-t border-ink-200'
                        : i === 0
                        ? 'text-lg'
                        : ''
                    }
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                {t('about_values_kicker')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                {t('about_values_title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {values.map((v, i) => (
                <div key={i} className="p-6 rounded-xl bg-white border border-ink-200 shadow-card">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-600 mb-4">
                    <v.Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-ink-950 mb-2">{v.title}</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-prose pb-24 pt-20 md:pt-28">
          <div className="max-w-3xl mx-auto rounded-3xl bg-ink-950 text-white p-10 md:p-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {t('about_contact_title')}
                </h2>
                <p className="text-ink-300 mb-6 leading-relaxed">
                  {t('about_contact_desc')}
                </p>
                <Button
                  href="mailto:hello@inkly.tech"
                  variant="primary"
                  leftIcon={<Mail size={14} />}
                >
                  hello@inkly.tech
                </Button>
              </div>
              <div className="md:border-l md:border-ink-800 md:pl-12">
                <h3 className="text-lg font-semibold mb-3">{t('about_try_title')}</h3>
                <p className="text-ink-300 mb-6 text-sm leading-relaxed">
                  {t('about_try_desc')}
                </p>
                <Button
                  to={session ? '/app' : '/signup'}
                  variant="secondary"
                  rightIcon={<ArrowRight size={14} />}
                >
                  {session ? t('hero_cta_open') : t('hero_cta_primary')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
