import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

export default function Pricing({ session }) {
  const plans = [
    {
      name: 'Free',
      tagline: 'For curious creators',
      price: '$0',
      period: 'forever',
      cta: session ? 'Open the app' : 'Start for free',
      ctaTo: session ? '/app' : '/signup',
      ctaVariant: 'secondary',
      highlighted: false,
      features: [
        { ok: true, text: 'Draw your full A–Z alphabet' },
        { ok: true, text: 'Lowercase, uppercase, numbers' },
        { ok: true, text: 'Live notebook preview' },
        { ok: true, text: 'Saved in the cloud forever' },
        { ok: true, text: 'Export as PNG alphabet sheet' },
        { ok: false, text: 'Export as TTF/OTF font file' },
        { ok: false, text: 'Multiple alphabets per account' },
        { ok: false, text: 'Priority support' },
      ],
    },
    {
      name: 'Pro',
      tagline: 'For serious writers',
      price: '$5',
      period: 'per month',
      cta: 'Coming soon',
      ctaTo: null,
      ctaVariant: 'primary',
      highlighted: true,
      badge: 'Most popular',
      features: [
        { ok: true, text: 'Everything in Free' },
        { ok: true, text: 'Export as real TTF font file' },
        { ok: true, text: 'Up to 5 alphabets per account' },
        { ok: true, text: 'Punctuation and special characters' },
        { ok: true, text: 'Higher-resolution exports' },
        { ok: true, text: 'Priority email support' },
        { ok: true, text: 'Early access to new features' },
        { ok: false, text: 'Team workspaces' },
      ],
    },
    {
      name: 'Team',
      tagline: 'For studios & schools',
      price: '$15',
      period: 'per user / month',
      cta: 'Contact us',
      ctaTo: '/contact',
      ctaVariant: 'secondary',
      highlighted: false,
      features: [
        { ok: true, text: 'Everything in Pro' },
        { ok: true, text: 'Unlimited alphabets per user' },
        { ok: true, text: 'Shared team workspaces' },
        { ok: true, text: 'Centralized billing' },
        { ok: true, text: 'Admin controls and roles' },
        { ok: true, text: 'Single sign-on (SSO)' },
        { ok: true, text: 'Dedicated support channel' },
        { ok: true, text: 'Custom training session' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="container-prose pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-2xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <Sparkles size={12} />
              <span>Free during early access</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-950 mb-5">
              Simple, honest pricing.
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              Start free. Upgrade when you need more — and only then.
              No tricks, no hidden charges.
            </p>
          </div>
        </section>

        {/* ============ PLANS ============ */}
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

                {/* Plan name & tagline */}
                <div className="mb-6">
                  <h3
                    className={`text-lg font-semibold ${
                      plan.highlighted ? 'text-white' : 'text-ink-950'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      plan.highlighted ? 'text-ink-400' : 'text-ink-500'
                    }`}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-5xl font-bold tracking-tight ${
                        plan.highlighted ? 'text-white' : 'text-ink-950'
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? 'text-ink-400' : 'text-ink-500'
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
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

                {/* Feature list */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {feature.ok ? (
                        <Check
                          size={16}
                          className={`flex-shrink-0 mt-0.5 ${
                            plan.highlighted ? 'text-brand-400' : 'text-brand-600'
                          }`}
                        />
                      ) : (
                        <X
                          size={16}
                          className={`flex-shrink-0 mt-0.5 ${
                            plan.highlighted ? 'text-ink-600' : 'text-ink-300'
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          feature.ok
                            ? plan.highlighted
                              ? 'text-ink-200'
                              : 'text-ink-700'
                            : plan.highlighted
                            ? 'text-ink-500 line-through'
                            : 'text-ink-400 line-through'
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

        {/* ============ FAQ ============ */}
        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                Frequently asked
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                Questions, answered.
              </h2>
            </div>

            <div className="max-w-3xl mx-auto grid gap-4">
              {[
                {
                  q: 'Is Inkly really free?',
                  a: 'Yes. The Free plan is genuinely free forever — no credit card, no trial period that flips to paid. Pro and Team plans are for people who want more. Most users will be perfectly happy on Free.',
                },
                {
                  q: 'When will Pro be available?',
                  a: 'Pro is coming after we polish the export-to-TTF feature, which is the main reason to upgrade. We expect it ready in the next few months. Early Free users will get a discount when Pro launches.',
                },
                {
                  q: 'Where is my work saved?',
                  a: 'Your alphabet is saved to your account in our secure cloud database. Sign in on any device — phone, laptop, tablet — and your work is waiting. Nothing is stored only locally.',
                },
                {
                  q: 'Can I delete my account and data?',
                  a: 'Yes, anytime. Email us and we will permanently delete your account and all your drawings within 7 days. You can also export your work first.',
                },
                {
                  q: 'Who made Inkly?',
                  a: 'Inkly is built by a single creator — a chemistry student in Mongolia who wanted his own handwriting in his digital notes. The whole project is a labor of care, not a venture-backed startup.',
                },
              ].map((item, i) => (
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
                  <div className="px-5 pb-5 -mt-1 text-ink-600 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="container-prose py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
              Start drawing your font today.
            </h2>
            <p className="text-lg text-ink-600 mb-8">
              Free forever. Upgrade only when you're ready.
            </p>
            <Button
              to={session ? '/app' : '/signup'}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
            >
              {session ? 'Open the app' : 'Get started — it\'s free'}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
