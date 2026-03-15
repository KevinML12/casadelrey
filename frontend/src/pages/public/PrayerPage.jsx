import PrayerForm from '../../components/sections/PrayerForm';
import PageHero from '../../components/layout/PageHero';
import { MessageSquare, Users, Heart, Lock } from 'lucide-react';

const TRUST = [
  { icon: Users,  text: 'Comunidad que ora contigo' },
  { icon: Heart,  text: 'Respondidas con amor' },
  { icon: Lock,   text: 'Absoluta confidencialidad' },
];

export default function PrayerPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero icon={MessageSquare} title="Peticiones de Oración" subtitle='"Clama a mí, y yo te responderé." — Jeremías 33:3'>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {TRUST.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
              <Icon size={12} className="text-gold" /> {text}
            </span>
          ))}
        </div>
      </PageHero>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto bg-card border border-line rounded-2xl shadow-card p-8 md:p-10">
          <PrayerForm />
        </div>
      </div>
    </main>
  );
}
