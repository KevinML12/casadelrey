import PrayerForm from '../../components/sections/PrayerForm';
import PageHero from '../../components/layout/PageHero';

const TRUST = [
  { icon: 'groups',     text: 'Comunidad que ora contigo' },
  { icon: 'favorite',   text: 'Respondidas con amor' },
  { icon: 'lock',       text: 'Absoluta confidencialidad' },
];

export default function PrayerPage() {
  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="volunteer_activism" title="Peticiones de Oración" subtitle='"Clama a mí, y yo te responderé." — Jeremías 33:3'>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {TRUST.map(({ icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-m font-medium"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)' }}>
              <span className="ms" style={{ fontSize: 14, color: '#A4C8FF' }}>{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </PageHero>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto bg-surf-low border border-outline-var rounded-2xl shadow-elev-1 p-8 md:p-10">
          <PrayerForm />
        </div>
      </div>
    </main>
  );
}
