import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import { useDonationPurposes } from '../../lib/donationPurposes';

export default function DonatePage() {
  // Misma fuente admin-editable que el selector de "Destino" del acordeón
  // (useDonationPurposes) -- antes esta vitrina tenía SU PROPIO arreglo
  // (IMPACT) con 2 destinos que ni siquiera eran seleccionables de
  // verdad (Educación/Familias). Ahora es una sola lista real.
  const purposes = useDonationPurposes();
  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <PageHero
        title="Tu generosidad transforma."
        subtitle="Cada quetzal sembrado con fe produce fruto eterno."
        photoSlot="hero_donar"
        photoFallback="/images/bg-legado.jpg"
        align="left"
      />

      {/* Sin foto de ambiente: la que había aquí llevaba `opacity-35` MÁS un
          scrim de tres paradas encima, así que llegaba al visitante al ~14%
          de su color real. Eso ya no es una escena detrás del cristal, es una
          textura gris que además le baja el contraste al propio cristal.
          Mejor bg-bg limpio y honesto. Si un día vuelve una foto a esta
          sección, va a color pleno con una de las clases .scrim-*. */}
      <section className="relative py-16 md:py-24 z-10">
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

            {/* Destinos + versículo */}
            <div>
              {/* Sin Reveal: el titular de sección es el punto fijo contra el
                  que llega la lista de abajo. Si el título también entra
                  deslizándose, no queda nada quieto que le dé sentido al
                  movimiento y el scroll se siente gelatinoso. */}
              <h2 className="text-d2 text-white mb-8">
                Siembra con alegría.
              </h2>

              {/* Lista tipo directorio, no cinco cards de cristal apiladas.
                  Cuando TODO es una card, la card deja de ser una decisión:
                  cinco destinos con el mismo material y el mismo bisel
                  compiten entre sí en vez de leerse como una sola oferta.
                  Mismo patrón que el directorio de células. */}
              <RevealList className="flex flex-col divide-y divide-white/10">
                {purposes.map(({ value, title, description }) => (
                  <RevealItem key={value} className="py-4 flex items-baseline justify-between gap-6">
                    {/* shrink-0 + text-right: "Ministerio Joven" no se parte
                        en dos líneas y la descripción queda alineada al borde
                        derecho, que es lo que hace legible una fila de
                        directorio cuando el segundo dato envuelve. */}
                    <h3 className="text-17 font-bold text-white shrink-0">{title}</h3>
                    <p className="text-14 text-white/55 text-right">{description}</p>
                  </RevealItem>
                ))}
              </RevealList>

              {/* Versículo */}
              <Reveal delay={0.1}>
                <div className="mt-6 glass-light rounded-[22px] p-8">
                  <blockquote>
                    <p className="text-bg leading-relaxed mb-4 text-18 md:text-22">
                      "El que siembra escasamente, también segará escasamente; y el que siembra
                      generosamente, generosamente también segará."
                    </p>
                    <cite className="not-italic text-bg/50 text-13 font-bold">
                      2 Corintios 9:6
                    </cite>
                  </blockquote>
                </div>
              </Reveal>
            </div>

            {/* Acordeón de donación — cada paso es su propia card de
                cristal directamente sobre el canvas (sin panel envolvente:
                cristal anidado prohibido por la guía) */}
            <div>
              {/* text-d3 y no d2: esta columna siempre estuvo subordinada a
                  "Siembra con alegría" (era clamp 1.7-2.2 contra 2-3), y el
                  token conserva esa relación sin volver a inventar un clamp.
                  Fuera del Reveal por lo mismo que el otro titular: lo que
                  llega es el acordeón, el título ya estaba. */}
              <h2 className="text-d3 text-white mb-7">
                Sembrar es sumar.
              </h2>
              <Reveal from="right" delay={0.05}>
                <DonationCard />
              </Reveal>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
