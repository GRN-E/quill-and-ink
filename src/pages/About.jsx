import { Heart, Code, Beaker, MapPin, ArrowRight, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

export default function About({ session }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="container-prose pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100">
              <MapPin size={12} />
              <span>Built in Ulaanbaatar, Mongolia</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-950 mb-6">
              A small tool,<br />
              made with care.
            </h1>
            <p className="text-lg md:text-xl text-ink-600 leading-relaxed">
              Inkly isn't a startup. It's a project — one
              person's attempt to put a piece of themselves back into
              the digital page.
            </p>
          </div>
        </section>

        {/* ============ STORY ============ */}
        <section className="container-prose py-12 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="prose-content space-y-6 text-ink-700 leading-relaxed">
              <p className="text-lg">
                I'm Ermuun, a chemistry student from Ulaanbaatar.
                In 2026 I leave for Germany to start a master's in Materials Science
                at TU Darmstadt. Between problem sets and laboratory reports,
                I built this.
              </p>

              <p>
                The idea was simple: I wanted my own handwriting in my notes.
                Every digital tool I used gave me the same handful of fonts —
                Times New Roman, Arial, Calibri. They all looked like they
                belonged to someone else. To no one, really.
              </p>

              <p>
                A page of handwritten notes feels different. It carries a
                trace of who wrote it. The slight slant, the loop of an{' '}
                <span className="italic">l</span>, the place where the pen
                pressed harder — these aren't flaws. They're presence.
              </p>

              <p>
                Inkly is a small attempt to bring that back. Draw your alphabet
                once. Type anywhere. Read what looks like you.
              </p>

              <p className="text-ink-500 italic pt-4 border-t border-ink-200">
                — Ermuun, founder
              </p>
            </div>
          </div>
        </section>

        {/* ============ VALUES / WHY IT'S DIFFERENT ============ */}
        <section className="bg-ink-50 border-y border-ink-200 py-20 md:py-28">
          <div className="container-prose">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                What we believe
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                A different kind of software.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  Icon: Heart,
                  title: 'Personal, not corporate',
                  desc: 'Built by one person who cares about the details. No board meetings, no growth hacks. Just a tool, made well.',
                },
                {
                  Icon: Code,
                  title: 'Open and honest',
                  desc: 'Free where it can be free. Paid where it must be paid. No dark patterns, no surprise charges, no selling your data.',
                },
                {
                  Icon: Beaker,
                  title: 'A scientist\'s eye',
                  desc: 'My chemistry training showed me precision. I bring the same care to typography — every curve and spacing, measured.',
                },
              ].map((v, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-white border border-ink-200 shadow-card"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-600 mb-4">
                    <v.Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-ink-950 mb-2">
                    {v.title}
                  </h3>
                  <p className="text-sm text-ink-600 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ JOURNEY / FACTS ============ */}
        <section className="container-prose py-20 md:py-28">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
                The journey so far
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-950 mb-4">
                A few things about Inkly.
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '2026', label: 'Founded' },
                { value: '1', label: 'Person on the team' },
                { value: '62', label: 'Glyphs you can draw' },
                { value: '∞', label: 'Times you can rewrite a letter' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-ink-950 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-ink-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTACT / FINAL CTA ============ */}
        <section className="container-prose pb-24">
          <div className="max-w-3xl mx-auto rounded-3xl bg-ink-950 text-white p-10 md:p-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Have a question?
                </h2>
                <p className="text-ink-300 mb-6 leading-relaxed">
                  I read every email personally. Tell me what you're making, what
                  you wish worked better, or just say hello.
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
                <h3 className="text-lg font-semibold mb-3">
                  Try Inkly yourself.
                </h3>
                <p className="text-ink-300 mb-6 text-sm leading-relaxed">
                  The fastest way to understand what Inkly is — draw your
                  first letter.
                </p>
                <Button
                  to={session ? '/app' : '/signup'}
                  variant="secondary"
                  rightIcon={<ArrowRight size={14} />}
                >
                  {session ? 'Open the app' : 'Start drawing'}
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
