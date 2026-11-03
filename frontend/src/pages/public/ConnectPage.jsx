import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../lib/apiClient";
import { FieldLight } from "../../components/ui/Glass";
import Reveal from "../../components/ui/Reveal";
import { useSitePhoto } from "../../lib/feed";
import SectionBg from "../../components/ui/SectionBg";

const CATEGORIES = [
  { value: "primera_vez", label: "Es mi primera vez" },
  { value: "reconciliado", label: "Vuelvo después de un tiempo" },
  { value: "busco_celula", label: "Busco una célula" },
];
const HOW_FOUND = [
  { value: "invitacion", label: "Invitación de un amigo" },
  { value: "redes", label: "Redes sociales" },
  { value: "publicidad", label: "Publicidad" },
  { value: "otro", label: "Otro" },
];

export default function ConnectPage() {
  const photo = useSitePhoto(
    "hero_conectate",
    "/images/backgrounds/congregacion.webp",
  );
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    how_found: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    if (!form.name.trim() || !form.phone.trim() || !form.category) {
      setError("Escribe tu nombre, teléfono y elige qué te trae por aquí.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/connect-cards", {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      setDone(true);
    } catch (failure) {
      setError(
        failure.response?.data?.error ||
          "No se pudo enviar. Conservamos tus datos para que puedas reintentar.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
      <SectionBg
        src={photo}
        fallbackSrc="/images/backgrounds/congregacion.webp"
        opacity="opacity-100"
        scrimClassName="bg-gradient-to-r from-bg/20 via-bg/30 to-bg/60"
      />
      <div className="relative z-10 mx-auto flex max-w-5xl justify-center lg:justify-end">
        <Reveal className="w-full max-w-lg glass-light rounded-[16px] p-6 sm:p-8 text-bg [color-scheme:light]">
          <h1 className="text-32 sm:text-40 font-bold tracking-tight leading-tight">
            Conéctate
          </h1>
          {done ? (
            <div role="status" className="pt-7 pb-2">
              <h2 className="text-24 font-bold">Ya recibimos tus datos.</h2>
              <p className="mt-4 text-16 leading-relaxed text-bg/75">
                El equipo se pondrá en contacto contigo por teléfono o WhatsApp.
              </p>
              <Link
                to="/"
                className="ui-action mt-7 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-bg px-5 py-3 text-14 font-bold text-white focus-ring"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-3 mb-7 max-w-sm text-15 leading-relaxed text-bg/75">
                Déjanos tus datos para que podamos contactarte.
              </p>
              <form
                onSubmit={submit}
                aria-label="Formulario de conexión"
                className="space-y-5"
              >
                <fieldset disabled={loading}>
                  <legend className="sr-only">Datos de contacto</legend>
                  <div className="space-y-5">
                    <FieldLight
                      name="name"
                      autoComplete="name"
                      label="Nombre *"
                      value={form.name}
                      onChange={set("name")}
                      maxLength={100}
                      placeholder="Tu nombre completo"
                      required
                    />
                    <FieldLight
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      label="Teléfono *"
                      value={form.phone}
                      onChange={set("phone")}
                      maxLength={30}
                      placeholder="Tu número o WhatsApp"
                      required
                    />
                    <FieldLight
                      as="select"
                      name="category"
                      label="¿Qué te trae por aquí? *"
                      value={form.category}
                      onChange={set("category")}
                      required
                    >
                      <option value="" disabled>
                        Selecciona una opción
                      </option>
                      {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </FieldLight>
                    <details className="border-t border-bg/15 pt-1">
                      <summary className="min-h-11 list-item py-3 cursor-pointer rounded-lg text-14 font-semibold text-bg/70 focus-ring marker:text-bg/50">
                        Más información (opcional)
                      </summary>
                      <div className="space-y-4 pt-3 pb-1">
                        <FieldLight
                          name="email"
                          autoComplete="email"
                          type="email"
                          label="Correo"
                          value={form.email}
                          onChange={set("email")}
                          maxLength={100}
                          placeholder="tu@correo.com"
                        />
                        <FieldLight
                          as="select"
                          name="how_found"
                          label="¿Cómo nos conociste?"
                          value={form.how_found}
                          onChange={set("how_found")}
                        >
                          <option value="">Prefiero no indicar</option>
                          {HOW_FOUND.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </FieldLight>
                      </div>
                    </details>
                    {error && (
                      <p
                        className="rounded-[12px] border border-rose/30 bg-white/40 px-4 py-3 text-14 text-bg"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="ui-action w-full min-h-12 rounded-[12px] bg-bg px-5 py-3.5 text-15 font-bold text-white focus-ring disabled:opacity-50"
                    >
                      {loading ? "Enviando…" : "Enviar"}
                    </button>
                  </div>
                </fieldset>
              </form>
            </>
          )}
        </Reveal>
      </div>
    </main>
  );
}
