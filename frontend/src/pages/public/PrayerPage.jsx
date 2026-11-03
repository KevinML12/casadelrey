import PrayerForm from '../../components/sections/PrayerForm';
import Reveal from '../../components/ui/Reveal';
import { useSitePhoto } from '../../lib/feed';
import SectionBg from '../../components/ui/SectionBg';

export default function PrayerPage() {
  const photo = useSitePhoto('hero_oracion', '/images/backgrounds/congregacion.webp');
  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
      <SectionBg src={photo} fallbackSrc="/images/backgrounds/congregacion.webp" opacity="opacity-100" scrimClassName="bg-gradient-to-r from-bg/20 via-bg/30 to-bg/60" />
      <div className="relative z-10 mx-auto flex max-w-5xl justify-center lg:justify-end">
        <Reveal className="w-full max-w-xl glass-light rounded-[16px] p-6 sm:p-8 text-bg">
          <h1 className="text-32 sm:text-40 font-semibold tracking-tight leading-tight">Oración</h1>
          <PrayerForm />
        </Reveal>
      </div>
    </main>
  );
}
