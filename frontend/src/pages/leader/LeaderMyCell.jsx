// ============================================================
//  LeaderMyCell — el líder edita los datos de SU propia célula.
//
//  Existe porque el día, la hora y el "qué esperar" los sabe él, no un
//  admin: si esta semana la reunión se movió, él se entera primero.
//  Obligarlo a pedirle el cambio a un administrador es exactamente lo que
//  hace que un dato así se quede viejo y el sitio público termine
//  publicando una hora que ya no es.
//
//  Alcance deliberadamente estrecho: SOLO los campos de la reunión.
//  Nombre, código, tipo, zona, líder asignado y activo/inactivo siguen
//  siendo de admin -- eso es estructura de la iglesia, no operación
//  semanal de un grupo. El backend además busca la célula POR leader_id
//  (no por un :id del cuerpo), así que un líder no puede tocar la de otro
//  ni mandando el ID a mano.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LeaderMyCell() {
  const [cell, setCell] = useState(null);
  const [form, setForm] = useState({ day: '', time: '', description: '', what_to_expect: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  // Sin célula asignada NO es un error del líder: es que un admin todavía
  // no se la asignó. Se distingue del fallo de red para no acusarlo de
  // algo que no depende de él.
  const [sinCelula, setSinCelula] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    apiClient.get('/leader/my-cell')
      .then((r) => {
        setCell(r.data);
        setForm({
          day: r.data.day || '',
          time: r.data.time || '',
          description: r.data.description || '',
          what_to_expect: r.data.what_to_expect || '',
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) setSinCelula(true);
        else toast.error('No se pudo cargar tu célula.');
      })
      .finally(() => setCargando(false));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const r = await apiClient.put('/leader/my-cell', form);
      setCell(r.data);
      toast.success('Datos actualizados — ya se ven en la página pública.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
      </div>
    );
  }

  if (sinCelula) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-headline-s text-bg font-bold leading-tight">Mi célula</h1>
        <div className="glass-light rounded-[22px] card-spring p-6 mt-6">
          <p className="text-body-m text-bg/70 leading-relaxed">
            Todavía no tienes una célula asignada. Un administrador te la asigna
            desde el panel, en Células, eligiéndote como líder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-headline-s text-bg font-bold leading-tight">{cell.name}</h1>
      <p className="text-body-s text-bg/50 mt-0.5">
        {cell.code}{cell.zone ? ` · ${cell.zone}` : ''} — esto es lo que ve quien visita la página de Células.
      </p>

      <form onSubmit={guardar} className="glass-light rounded-[22px] card-spring p-5 sm:p-6 mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Día de reunión"
            value={form.day}
            onChange={set('day')}
            placeholder="Ej. Martes"
            helperText="Texto libre: si se reúnen cada 15 días o en sábados alternos, escríbelo tal cual."
          />
          <Input label="Hora" value={form.time} onChange={set('time')} placeholder="Ej. 7:00 PM" />
        </div>

        <Textarea
          label="Descripción de la célula"
          value={form.description}
          onChange={set('description')}
          rows={2}
          placeholder="En una o dos frases, de qué va tu célula."
        />

        <Textarea
          label="¿Qué esperar en una reunión?"
          value={form.what_to_expect}
          onChange={set('what_to_expect')}
          rows={3}
          placeholder="Qué pasa en una reunión típica: cuánto dura, si se canta, si hay comida…"
          helperText="Es la pregunta silenciosa de quien nunca ha ido a orar a casa de alguien que no conoce. Contestarla baja la barrera más que cualquier otra cosa."
        />

        <div className="flex items-center gap-3 pt-2 border-t border-bg/10">
          <Button type="submit" variant="filled" disabled={guardando} className="justify-center">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <p className="text-body-s text-bg/45">Se publica al instante.</p>
        </div>
      </form>

      <p className="text-body-s text-bg/45 mt-4 leading-relaxed">
        El nombre, el código, el tipo y la zona los administra el equipo — si
        alguno está mal, avísales.
      </p>
    </div>
  );
}
