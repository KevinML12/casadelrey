import PrayerForm from '../../components/sections/PrayerForm';
import PageHero from '../../components/layout/PageHero';
import { Icon, Halos } from '../../components/ui/Glass';

const TRUST = [
  { icon: 'users', text: 'Comunidad que ora contigo' },
  { icon: 'heart', text: 'Respondidas con amor' },
  { icon: 'spark', text: 'Absoluta confidencialidad' },
];

export default function PrayerPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <PageHero
        icon="volunteer_activism"
        eyebrow="Peticiones de oraciÃ³n"
        title="Clama y Ã‰l responde."
        subtitle='"Clama a mÃ­, y yo te responderÃ©." â€” JeremÃ­as 33:3'
      >
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {TRUST.map(({ icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink"
            >
              <Icon name={icon} className="w-3.5 h-3.5 text-celeste" />
              {text}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <Halos variant="soft" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="bg-bg border border-ink-soft shadow-card-lg rounded-card p-7 md:p-10">
            <PrayerForm />
          </div>
        </div>
      </section>
    </main>
  );
}
