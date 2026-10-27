import PrayerForm from '../../components/sections/PrayerForm';
import PageHero from '../../components/layout/PageHero';
import Reveal from '../../components/ui/Reveal';
import SectionBg from '../../components/ui/SectionBg';

const TRUST = [
  { text: 'Comunidad que ora contigo' },
  { text: 'Respondidas con amor' },
  { text: 'Absoluta confidencialidad' },
];

export default function PrayerPage() {
  return (
    <main className="min-h-screen text-ink">
      <PageHero
        title="Clama y Él responde."
        subtitle='"Clama a mí, y yo te responderé." — Jeremías 33:3'
        photoSlot="hero_oracion"
        photoFallback="/images/bg-ensenanzas.jpg"
      >
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {TRUST.map(({ text }) => (
            <span
              key={text}
              className="inline-flex items-center glass rounded-full px-4 py-2 text-13 font-semibold text-ink"
            >
              {text}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <SectionBg src="/images/components/bg_oracion.jpg" />

        <Reveal className="relative z-10 max-w-3xl mx-auto px-6">

          <div className="glass-light liquid-shine rounded-[28px] p-7 md:p-10">
            <PrayerForm />
          </div>
        </Reveal>
      </section>
    </main>
  );
}
