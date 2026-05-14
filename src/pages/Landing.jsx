import { PenTool, Sparkles, Download, Cloud, Zap, Heart, Star, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

export default function Landing({ session }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="container-prose pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <Sparkles size={12} />
              <span>Now in early access — free for everyone</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink-950 mb-6">
              Your handwriting,<br />
              <span className="text-brand-600">made into a font.</span>
            </h1>
            <p className="text-lg md:text-xl text-ink-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Draw your alphabet once. Use it forever. Write anywhere
              in your own hand, on any device, in any document.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                to={session ? '/app' : '/signup'}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                {session ? 'Open the app' : 'Start for free'}
              </Button>
              <Button to="/pricing" variant="ghost" size="lg">
                See pricing
              </Button>
            </div>
            <p className="mt-6 text-xs text-ink-500">
              No credit card required · Works on phone and computer · Saved in the cloud
            </p>
          </div>

          {/* Visual mockup teaser */}
          <div className="mt-16 md:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-ink-200 shadow-floating bg-white">
              <div className="aspect-[16/9] bg-gradient-to-br from-brand-50 via-white to-ink-50 flex items-center justify-center p-8">
                <div className="text-center">
                  <PenTool size={48} className="mx-auto mb-4 text-brand-600" />
                  <p className="text-ink-500 text-sm italic">
                    The Inkly workspace — draw, save, write
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="container-prose py-20 md:py-28 border-t border-ink-100">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
              Everything you need
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
              A complete workshop in your browser.
            </h2>
            <p className="text-lg text-ink-600">
              No software to install. No special hardware. Just draw, save, and your font is ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: PenTool,
                title: 'Pressure-sensitive drawing',
                desc: 'Each stroke responds to your speed and pressure. Thin lines on the upstroke, thick on the down. Just like a real pen.',
              },
              {
                Icon: Cloud,
                title: 'Saves to your account',
                desc: 'Sign in on any device, and your alphabet is waiting. Phone, tablet, laptop — your work follows you.',
              },
              {
                Icon: Zap,
                title: 'Live preview',
                desc: 'Type any text in the notebook and watch it appear in your handwriting instantly. See your font in action.',
              },
              {
                Icon: Sparkles,
                title: 'Smart letter spacing',
                desc: 'Letters connect into flowing words, not stamped boxes. Proper typography that reads as one continuous hand.',
              },
              {
                Icon: Download,
                title: 'Export anywhere',
                desc: 'Download your full alphabet as a printable sheet. Use it in documents, designs, or as a reference.',
              },
              {
                Icon: Heart,
                title: 'Made for you',
                desc: 'Built by a chemistry student in Mongolia who wanted his own handwriting in his notes. For anyone who values the personal.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white border border-ink-200 hover:border-ink-300 hover:shadow-elevated transition-base"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-600 mb-4">
                  <f.Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-ink-950 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                How it works
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                Three steps. Your font is ready.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
              {[
                {
                  number: '01',
                  title: 'Draw your letters',
                  desc: 'Open the editor and draw A through Z, plus numbers. Take your time — you can always redo any letter.',
                },
                {
                  number: '02',
                  title: 'Watch it come alive',
                  desc: 'As you save letters, type anything in the notebook to see your handwriting in real sentences.',
                },
                {
                  number: '03',
                  title: 'Use it anywhere',
                  desc: 'Export your alphabet or keep it in the cloud. Sign in on any device, anytime, to keep writing.',
                },
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="text-5xl md:text-6xl font-bold text-brand-200 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-ink-950 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-ink-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS / SOCIAL PROOF ============ */}
        <section className="container-prose py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-brand-500 text-brand-500" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
              Loved by people who write.
            </h2>
            <p className="text-lg text-ink-600">
              From note-takers to designers, anyone who wants their own touch on the page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote:
                  "I keep all my chemistry notes in my own handwriting now. It feels personal, not generated. My professors love it.",
                name: 'Anonymous student',
                role: 'Chemistry undergrad',
              },
              {
                quote:
                  "Finally a font tool that doesn't feel like an engineering manual. It just lets you draw and writes back.",
                name: 'Anonymous designer',
                role: 'Freelance illustrator',
              },
              {
                quote:
                  "I made a font from my grandmother's handwriting before her hands shook too much to write. I have it forever now.",
                name: 'Anonymous user',
                role: 'Family archivist',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white border border-ink-200 shadow-card"
              >
                <p className="text-ink-800 leading-relaxed mb-5 italic">
                  "{t.quote}"
                </p>
                <div className="pt-5 border-t border-ink-100">
                  <p className="text-sm font-semibold text-ink-950">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="container-prose pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 text-white py-16 md:py-20 px-8 md:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-transparent" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Ready to make your font?
              </h2>
              <p className="text-lg text-ink-300 mb-8 max-w-xl">
                Free to start. No card required. You'll be drawing your first letter in under a minute.
              </p>
              <Button
                to={session ? '/app' : '/signup'}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                {session ? 'Continue in the app' : 'Get started for free'}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
