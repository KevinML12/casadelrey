import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import ParallaxImg from '../../components/ui/ParallaxImg';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import WindowStack from '../../components/ui/WindowStack';
import apiClient from '../../lib/apiClient';
import { useSitePhoto, useApi } from '../../lib/feed';
import { useVolunteerAreas } from '../../lib/volunteerAreas';
import toast from 'react-hot-toast';

const PRESS = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Botón/CTA claro (bg-bg text-white) -- ya no hay GlassButton oscuro
// en este flujo, todo el modal es glass-light.
const btnPrimary = 'w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-[15px] font-bold focus-ring disabled:opacity-60 shadow-card hover:opacity-90';
const btnGhost = 'w-full inline-flex items-center justify-center gap-2 rounded-pill text-bg/55 hover:text-bg hover:bg-bg/5 px-6 py-3.5 text-[14px] font-semibold transition-colors';
const btnSmallPrimary = 'px-4 py-2 rounded-full bg-bg text-white text-[13px] font-bold disabled:opacity-40 hover:opacity-90 transition-opacity';
const btnSmallGhost = 'px-4 py-2 rounded-full text-bg/55 hover:text-bg hover:bg-bg/5 text-[13px] font-semibold transition-colors';

// "Elige por mí" pero con un nombre que se lee bien en un formulario --
// no es que no importe el departamento, es que el POSTULANTE no tiene
// preferencia y delega la decision en el equipo. Valor real que llega
// al backend en vez de un department vacio/ambiguo.
const NO_PREFERENCE = 'sin_preferencia';
const NO_PREFERENCE_LABEL = 'Sin preferencia — que me recomienden';
const NO_PREFERENCE_WHY = 'Nuestro equipo va a revisar tus talentos e intereses para recomendarte el área donde más puedas servir y crecer.';

const STATS = [
  { n: '~90', label: 'Voluntarios sirviendo' },
  { n: '10', label: 'Departamentos' },
  { n: '20', label: 'Líderes de célula' },
];

// Agrupa los 10 departamentos en familias temáticas -- antes era un solo
// grid plano de 10 tarjetas idénticas, sin jerarquía visual.
const CATEGORIES = [
  { name: 'Alabanza y arte', values: ['alabanza', 'danza'] },
  { name: 'Anfitrionaje y protocolo', values: ['servidores', 'protocolo', 'pancartas'] },
  { name: 'Niños y enseñanza', values: ['maestros_ninos'] },
  { name: 'Multimedia y producción', values: ['tecnicos_audiovisuales', 'multimedia'] },
  { name: 'Oración y logística', values: ['oracion', 'logistica'] },
];

function ModalWrapper({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-light w-full max-w-md p-6 max-h-[90vh] overflow-y-auto rounded-[32px] text-bg"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Departamento ya elegido (por WindowStack, o "sin preferencia" por
// defecto) se muestra COMO DATO, no como un <select> abierto -- cambiar
// de opinion es una accion explicita ("Cambiar") en vez de un desliz
// accidental del mouse sobre un dropdown.
function DepartmentLocked({ department, areas, onRequestChange }) {
  const area = areas.find(a => a.value === department);
  return (
    <div className="rounded-[14px] border border-bg/12 bg-bg/5 px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-bg/45 mb-1">Departamento</p>
        <p className="text-[14.5px] font-bold text-bg truncate">{area ? area.title : NO_PREFERENCE_LABEL}</p>
      </div>
      <button type="button" onClick={onRequestChange} className="shrink-0 text-[13px] font-semibold text-bg/55 hover:text-bg underline underline-offset-4 decoration-bg/20">
        Cambiar
      </button>
    </div>
  );
}

function VolunteerForm({ department: initialDepartment, areas, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: initialDepartment || NO_PREFERENCE, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Cambiar de departamento requiere: abrir el selector (changing) ->
  // elegir uno (pendingChange, todavia NO aplicado) -> confirmar. Cerrar
  // sin confirmar deja form.department intacto -- la "doble verificacion"
  // que se pidio.
  const [changing, setChanging] = useState(false);
  const [pendingChange, setPendingChange] = useState('');
  // Enviar no dispara el POST directo -- primero confirma con el "por
  // que" de ese departamento a la vista.
  const [confirming, setConfirming] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const requestChange = () => { setPendingChange(form.department); setChanging(true); };
  const cancelChange = () => { setChanging(false); setPendingChange(''); };
  const confirmChange = () => {
    setForm(p => ({ ...p, department: pendingChange }));
    setChanging(false);
    setPendingChange('');
  };

  const reviewSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y correo son requeridos');
      return;
    }
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/volunteer/register', form);
      setSent(true);
      toast.success('Gracias — nos comunicaremos contigo pronto.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar. Intenta de nuevo.');
      setConfirming(false);
    } finally { setSubmitting(false); }
  };

  const area = areas.find(a => a.value === form.department);

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mx-auto mb-4">
          <Icon name="check" className="w-7 h-7 text-bg" stroke={2} />
        </div>
        <h3 className="text-[19px] text-bg font-bold mb-2">Inscripción recibida</h3>
        <p className="text-[14px] text-bg/60">Nuestro equipo se pondrá en contacto contigo.</p>
        <button onClick={onClose} className="mt-5 px-6 h-10 rounded-full bg-bg text-white text-[14px] font-semibold shadow-card hover:opacity-90">
          Listo
        </button>
      </div>
    );
  }

  // ── Pantalla: confirmar antes de enviar, con el "por qué" a la vista
  if (confirming) {
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setConfirming(false)} className="w-9 h-9 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center hover:bg-bg/15 transition-colors shrink-0">
            <Icon name="arrow" className="w-4 h-4 text-bg/60 rotate-180" stroke={2} />
          </button>
          <p className="text-[12px] text-bg font-bold uppercase tracking-wide">Confirmar aplicación</p>
        </div>
        <h3 className="text-[21px] font-bold text-bg tracking-tight mb-4">{area ? area.title : NO_PREFERENCE_LABEL}</h3>
        <div className="glass-light-nested rounded-[16px] p-5 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-bg/50 mb-2">¿Por qué aquí?</p>
          <p className="text-[14.5px] text-bg/75 leading-relaxed">{area ? area.why : NO_PREFERENCE_WHY}</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <motion.button {...PRESS} onClick={confirmSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? 'Enviando…' : 'Confirmar aplicación'}
            {!submitting && <Icon name="check" className="w-4 h-4" stroke={2} />}
          </motion.button>
          <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className={btnGhost}>
            Volver a editar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-bg font-bold uppercase tracking-wide">Aplicación</p>
          <p className="text-[13.5px] text-bg/60 mt-0.5">{area ? area.title : NO_PREFERENCE_LABEL}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center hover:bg-bg/15 transition-colors">
          <Icon name="close" className="w-4 h-4 text-bg/60" />
        </button>
      </div>

      <form onSubmit={reviewSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[13px] font-semibold text-bg/60 mb-2">Nombre completo</span>
            <input className="input-light" value={form.name} onChange={set('name')} required />
          </label>
          <label className="block">
            <span className="block text-[13px] font-semibold text-bg/60 mb-2">Correo electrónico</span>
            <input type="email" className="input-light" value={form.email} onChange={set('email')} required />
          </label>
        </div>
        <label className="block">
          <span className="block text-[13px] font-semibold text-bg/60 mb-2">Teléfono (opcional)</span>
          <input type="tel" className="input-light" value={form.phone} onChange={set('phone')} />
        </label>

        {!changing ? (
          <DepartmentLocked department={form.department} areas={areas} onRequestChange={requestChange} />
        ) : (
          <div className="rounded-[14px] border border-bg/12 bg-bg/5 p-4 space-y-3">
            <p className="text-[13px] font-semibold text-bg/60">
              ¿Seguro que quieres cambiar tu elección actual ({area ? area.title : NO_PREFERENCE_LABEL})?
            </p>
            <select
              className="input-light w-full appearance-none cursor-pointer"
              value={pendingChange}
              onChange={e => setPendingChange(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value={NO_PREFERENCE}>{NO_PREFERENCE_LABEL}</option>
              {areas.map(a => <option key={a.value} value={a.value}>{a.title}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" disabled={!pendingChange} onClick={confirmChange} className={btnSmallPrimary}>
                Confirmar cambio
              </button>
              <button type="button" onClick={cancelChange} className={btnSmallGhost}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <label className="block">
          <span className="block text-[13px] font-semibold text-bg/60 mb-2">Mensaje (opcional)</span>
          <textarea
            rows={3}
            className="input-light w-full resize-none"
            value={form.message}
            onChange={set('message')}
            placeholder="Cuéntanos por qué quieres servir..."
          />
        </label>

        <motion.button
          type="submit"
          {...PRESS}
          className={btnPrimary}
        >
          Continuar
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </motion.button>
      </form>
    </>
  );
}

// Una sola superficie: foto + degradado + texto directo encima, sin
// panel anidado con su propio borde (el mismo ajuste que se hizo en
// EventCard -- dos cajas separadas se leen como una card rota).
function DepartmentCard({ value, icon, title, photo, onClick }) {
  return (
    <Tilt
      as="button"
      type="button"
      onClick={onClick}
      max={4}
      glass="standard"
      className="liquid-shine glass-light relative overflow-hidden rounded-[20px] h-[170px] w-full text-left group"
    >
      <img
        src={photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/45 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        <div className="w-9 h-9 rounded-full bg-bg/85 flex items-center justify-center mb-2.5">
          <Icon name={icon} className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-[16px] font-bold text-bg tracking-tight leading-tight">{title}</h3>
      </div>
    </Tilt>
  );
}

export default function VolunteeringPage() {
  const [openKey, setOpenKey] = useState(null);   // departamento abierto en el WindowStack
  const [formDept, setFormDept] = useState(null);  // null = modal cerrado, '' = abierto sin preseleccion
  // Administrable desde /admin/site-photos (antes ruta hardcodeada — el
  // admin no podía cambiarla sin deploy). El local queda de fallback.
  const sectionImg = useSitePhoto('voluntariado_seccion', '/images/nosotros/servidores.jpg');
  // Departamentos reales desde /volunteer-areas (admin-editable), con
  // fallback local si la API aun no responde. Una sola llamada a
  // /site-photos, la resolucion de foto por departamento es JS plano (no
  // un hook por item) -- 10 useSitePhoto en un .map violaria las reglas
  // de hooks.
  const liveAreas = useVolunteerAreas();
  const sitePhotos = useApi('/site-photos') || {};
  const areas = liveAreas.map(a => ({ ...a, photo: sitePhotos[`voluntariado_${a.value}`] || a.photoFallback }));

  // Departamentos que el admin agregue y no encajen en ninguna de las 5
  // categorias curadas (values fijos abajo) igual deben aparecer en
  // algun lado -- "Otros" los recoge en vez de desaparecer en silencio.
  const categorized = new Set(CATEGORIES.flatMap(c => c.values));
  const leftover = areas.filter(a => !categorized.has(a.value));
  const categoriesWithLeftover = leftover.length > 0
    ? [...CATEGORIES, { name: 'Otros', values: leftover.map(a => a.value) }]
    : CATEGORIES;

  const windowItems = areas.map(a => ({ key: a.value, image: a.photo, title: a.title }));

  const openForm = (value = '') => {
    setOpenKey(null);
    setFormDept(value);
  };

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Sirve con tus talentos"
        title="Voluntariado"
        subtitle="Cada persona tiene un lugar. Únete a los más de 90 voluntarios que ya sirven en 10 departamentos."
        photoSlot="hero_voluntariado"
        photoFallback="/images/bg-ministerios.jpg"
      />

      <section className="relative py-4 pb-24 overflow-hidden">
        <ParallaxImg src={sectionImg} alt="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/55 to-bg" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <Reveal className="mb-10 text-center">
            <Eyebrow>Departamentos</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
              ¿Dónde quieres servir?
            </h2>
            <p className="mt-4 text-[15.5px] text-white/70">Toca un departamento para conocerlo mejor.</p>
            <button
              type="button"
              onClick={() => openForm('')}
              className="mt-3 text-[13.5px] font-semibold text-white/50 hover:text-white/80 transition-colors underline underline-offset-4 decoration-white/20"
            >
              ¿No sabes cuál elegir? Aplica de todas formas
            </button>
          </Reveal>

          <RevealList className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-14">
            {STATS.map(s => (
              <RevealItem key={s.label}>
                <div className="glass-light rounded-[18px] px-3 py-5 text-center h-full">
                  <div className="text-[26px] sm:text-[30px] font-extrabold text-bg tracking-tighter leading-none">{s.n}</div>
                  <div className="mt-1.5 text-[11px] sm:text-[11.5px] font-semibold text-bg/55 leading-tight">{s.label}</div>
                </div>
              </RevealItem>
            ))}
          </RevealList>

          <div className="space-y-10">
            {categoriesWithLeftover.map(cat => (
              <div key={cat.name}>
                <p className="text-[13px] font-bold text-white/50 uppercase tracking-tightish mb-4">{cat.name}</p>
                <RevealList className="grid sm:grid-cols-2 gap-4">
                  {areas.filter(a => cat.values.includes(a.value)).map(area => (
                    <RevealItem key={area.value}>
                      <DepartmentCard {...area} onClick={() => setOpenKey(area.value)} />
                    </RevealItem>
                  ))}
                </RevealList>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ventana de cristal por departamento -- foto, por que servir ahi,
          y el boton que lleva al formulario. Con 10 items, las flechas/
          dots de WindowStack ya se comportan como un carrusel entre
          departamentos sin codigo extra. */}
      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        height="min(70vh, 560px)"
        renderContent={(it) => {
          const a = areas.find(x => x.value === it.key);
          if (!a) return null;
          return (
            <div className="flex flex-col gap-5">
              <p className="text-white/70 text-[15px] leading-relaxed">{a.desc}</p>
              <div className="liquid-glass rounded-[16px] p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">¿Por qué aquí?</p>
                <p className="text-white/80 text-[14.5px] leading-relaxed">{a.why}</p>
              </div>
              <motion.button
                {...PRESS}
                onClick={() => openForm(a.value)}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-white text-bg px-6 py-4 text-[15px] font-bold shadow-card hover:opacity-90"
              >
                Aplicar a {a.title}
                <Icon name="arrow" className="w-4 h-4" stroke={2} />
              </motion.button>
            </div>
          );
        }}
      />

      {/* Formulario -- ya no vive siempre visible al fondo de la pagina,
          aparece como modal glass-light al presionar "Aplicar" (desde el
          WindowStack o el link "aplica de todas formas"). */}
      <AnimatePresence>
        {formDept !== null && (
          <ModalWrapper onClose={() => setFormDept(null)}>
            <VolunteerForm department={formDept} areas={areas} onClose={() => setFormDept(null)} />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </main>
  );
}
