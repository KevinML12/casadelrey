import DonationCard from '../../components/sections/DonationCard';
import SectionBg from '../../components/ui/SectionBg';
import { useDonationPurposes } from '../../lib/donationPurposes';
import { useSitePhoto } from '../../lib/feed';

export default function DonatePage(){
 const purposes=useDonationPurposes();const photo=useSitePhoto('hero_donar','/images/public_bg_donaciones.jpg');
 return <main className="relative min-h-[100svh] text-white pt-32 pb-20 px-4 sm:px-6 overflow-hidden"><SectionBg src={photo} scrimClassName="bg-bg/40"/>
  <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] items-start gap-8 lg:gap-16">
   <div className="lg:sticky lg:top-32"><p className="text-13 font-semibold text-white/80">Casa del Rey</p><h1 className="mt-3 text-40 sm:text-56 font-bold tracking-tight leading-tight">Tu generosidad transforma.</h1><p className="mt-5 max-w-md text-16 leading-relaxed text-white/85">Elige un destino y la forma de aportar. Si realizas un depósito, el equipo revisará tu comprobante antes de confirmar el importe.</p>
    <details className="mt-7 max-w-md rounded-[14px] border border-white/35 bg-bg/20 p-4"><summary className="min-h-11 cursor-pointer font-semibold text-14 focus-ring">Conocer los destinos</summary><div className="divide-y divide-white/20">{purposes.map(item=><div className="py-4" key={item.value}><h2 className="text-16 font-bold">{item.title}</h2><p className="mt-1 text-14 text-white/80">{item.description}</p></div>)}</div></details>
   </div>
   <section aria-label="Formulario de donación" className="min-w-0"><DonationCard/></section>
  </div>
 </main>;
}
