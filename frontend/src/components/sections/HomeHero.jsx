import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../lib/feed";
import { saludo } from "../../lib/greeting";
import { DUR, EASE_OUT } from "../../lib/motion";
import CrossfadePhoto from "../ui/CrossfadePhoto";
import CollectionNavigation from "../ui/CollectionNavigation";
import { GlassButton } from "../ui/Glass";

const FALLBACK = "/images/bg-hero.jpg";
const brand = {
  key: "brand",
  type: "hero",
  title: "CASA",
  secondLine: "DEL REY",
  label: "Iglesia cristiana · Huehuetenango",
  media: FALLBACK,
  ctaText: "Conéctate",
  ctaUrl: "/conectate",
};
const eventDate = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// One fixed photographic scene. Administrators own every published slide;
// changing it never moves the camera or advances while someone is reading.
export default function HomeHero() {
  const heroes = useApi("/hero/active");
  const events = useApi("/events/");
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(null);
  const [shown, setShown] = useState(null);
  const [failedVideos, setFailedVideos] = useState({});
  const [readyVideo, setReadyVideo] = useState(null);
  const { slides, upcoming } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = (Array.isArray(events) ? events : [])
      .filter(
        (event) =>
          event.is_active !== false &&
          /^\d{4}-\d{2}-\d{2}$/.test(event.date || ""),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = sorted.filter(
      (event) => new Date(event.date + "T12:00:00") >= today,
    );
    const published = (Array.isArray(heroes) ? heroes : heroes ? [heroes] : [])
      .filter((hero) => hero.title_line_1)
      .map((hero, index) => ({
        key: `hero-${hero.ID || hero.id || index}`,
        type: "hero",
        title: hero.title_line_1,
        secondLine: hero.title_line_2,
        label: (hero.label_top || "").replace(/^●\s*/, ""),
        subtitle: hero.subtitle,
        schedule: [hero.schedule_text, hero.verse_reference]
          .filter(Boolean)
          .join(" · "),
        media: hero.background_image_url || hero.fallback_image_url || FALLBACK,
        poster: hero.fallback_image_url || FALLBACK,
        ctaText: hero.cta_primary_text,
        ctaUrl: hero.cta_primary_url,
      }));
    const pool = upcoming.length
      ? upcoming.slice(0, 3)
      : sorted.slice(-2).reverse();
    for (const event of pool)
      published.push({
        key: `event-${event.ID || event.id}`,
        type: "event",
        title: event.title,
        label: upcoming.length ? "Próximo evento" : "Evento reciente",
        subtitle: event.description,
        schedule: [eventDate(event.date), event.time, event.location]
          .filter(Boolean)
          .join(" · "),
        media: event.cover_image || FALLBACK,
        ctaText: upcoming.length ? "Reservar mi lugar" : "Ver evento",
        ctaUrl: `/events?id=${event.ID || event.id}`,
      });
    return { slides: published.length ? published : [brand], upcoming };
  }, [heroes, events]);
  const requestedIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.key === selected),
  );
  const currentIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.key === shown),
  );
  const requested = slides[requestedIndex];
  const current = slides[currentIndex];
  const video =
    /\.mp4(?:[?#]|$)/i.test(requested.media) &&
    !failedVideos[requested.media] &&
    !reduced;
  const photograph = /\.mp4(?:[?#]|$)/i.test(requested.media)
    ? requested.poster || FALLBACK
    : requested.media;
  const go = (direction) =>
    setSelected(
      slides[(requestedIndex + direction + slides.length) % slides.length].key,
    );
  const subtitle =
    current.subtitle ||
    (current.type === "hero"
      ? `${saludo()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`
      : "");
  const longestLine = Math.max(
    current.title?.length || 0,
    current.secondLine?.length || 0,
  );
  const titleSize =
    longestLine > 45 ? "text-d3" : longestLine > 20 ? "text-d2" : "text-d1";
  const nextEvent = current.type === "hero" ? upcoming[0] : null;
  const ctaUrl = /^https?:\/\//i.test(current.ctaUrl || "")
    ? current.ctaUrl
    : current.ctaUrl?.startsWith("/")
      ? current.ctaUrl
      : "/conectate";

  return (
    <section
      id="inicio"
      aria-label="Presentación de la iglesia"
      className="home-hero relative isolate min-h-[100svh] flex items-center overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16"
    >
      <CrossfadePhoto
        src={photograph}
        fallbackSrc={FALLBACK}
        sceneKey={requested.key}
        priority
        onReady={() => {
          if (!video) setShown(requested.key);
        }}
      />
      {video && (
        <video
          key={requested.media}
          src={requested.media}
          poster={requested.poster || FALLBACK}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 motion-reduce:transition-none"
          style={{ opacity: readyVideo === requested.key ? 1 : 0 }}
          onLoadedData={() => {
            setReadyVideo(requested.key);
            setShown(requested.key);
          }}
          onError={() => {
            setFailedVideos((values) => ({
              ...values,
              [requested.media]: true,
            }));
            setShown(requested.key);
          }}
        />
      )}
      <div className="scrim-band" />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] items-end gap-12 lg:gap-20">
          <div
            role="region"
            aria-roledescription="carrusel"
            aria-label="Portadas de inicio"
            className="min-w-0"
            onKeyDown={(event) => {
              if (
                event.target.closest("a,input,select,textarea") ||
                event.defaultPrevented ||
                slides.length < 2
              )
                return;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                go(event.key === "ArrowRight" ? 1 : -1);
              }
            }}
          >
            <motion.div
              key={current.key}
              className="min-h-[320px] sm:min-h-[360px] flex flex-col justify-center"
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : DUR.base, ease: EASE_OUT }}
            >
              {current.label && (
                <p className="mb-5 text-14 font-semibold text-white/85">
                  {current.label}
                </p>
              )}
              <h1
                className={`${titleSize} max-w-[15ch] text-balance text-white [overflow-wrap:anywhere]`}
              >
                {current.title}
                {current.secondLine && (
                  <span className="block">{current.secondLine}</span>
                )}
              </h1>
              {subtitle && (
                <p className="mt-6 max-w-xl text-17 md:text-19 leading-relaxed text-white/90 line-clamp-3">
                  {subtitle}
                </p>
              )}
              {current.schedule && (
                <p className="mt-4 max-w-xl text-14 leading-relaxed text-white/80">
                  {current.schedule}
                </p>
              )}
              {current.ctaText && (
                <div className="mt-8">
                  {/^https?:\/\//i.test(ctaUrl) ? (
                    <GlassButton
                      as="a"
                      href={ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {current.ctaText}
                    </GlassButton>
                  ) : (
                    <GlassButton as={Link} to={ctaUrl}>
                      {current.ctaText}
                    </GlassButton>
                  )}
                </div>
              )}
            </motion.div>
            {slides.length > 1 && (
              <CollectionNavigation
                aria-label="Navegar portadas"
                className="mt-10 flex items-center gap-3 max-w-xl text-white"
              >
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="min-h-11 min-w-0 flex-1 px-3 text-left text-14 font-semibold focus-ring"
                >
                  <span>Anterior</span>
                  <span className="block truncate text-12 font-normal text-white/75">
                    {
                      slides[(currentIndex - 1 + slides.length) % slides.length]
                        .title
                    }
                  </span>
                </button>
                <span role="status" className="shrink-0 text-12 text-white/80">
                  {currentIndex + 1} de {slides.length}
                </span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="min-h-11 min-w-0 flex-1 px-3 text-right text-14 font-semibold focus-ring"
                >
                  <span>Siguiente</span>
                  <span className="block truncate text-12 font-normal text-white/75">
                    {slides[(currentIndex + 1) % slides.length].title}
                  </span>
                </button>
              </CollectionNavigation>
            )}
          </div>
          {nextEvent && (
            <aside
              aria-label="Próximo encuentro"
              className="hidden lg:block glass-light rounded-[16px] p-7 text-bg"
            >
              <p className="text-13 font-semibold text-bg/65 mb-4">
                Próximo evento
              </p>
              <h2 className="text-24 font-bold leading-tight [overflow-wrap:anywhere]">
                {nextEvent.title}
              </h2>
              <p className="mt-4 text-14 leading-relaxed text-bg/75">
                {eventDate(nextEvent.date)}
                {nextEvent.time ? ` · ${nextEvent.time}` : ""}
              </p>
              {nextEvent.location && (
                <p className="mt-2 text-14 text-bg/75">{nextEvent.location}</p>
              )}
              <Link
                to={`/events?id=${nextEvent.ID || nextEvent.id}`}
                className="ui-action mt-6 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-bg px-5 py-3 text-14 font-bold text-white focus-ring"
              >
                Ver evento
              </Link>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
