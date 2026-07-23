// ============================================================
//  LeaderEvents — visibilidad de eventos + quien se registro, para un
//  lider que ayuda a coordinar (ej. el retiro de su celula). Antes un
//  lider no tenia forma de ver esto desde su panel -- solo lectura a
//  proposito, crear/editar/borrar eventos sigue siendo solo de admin.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Icon } from '../../components/ui/Glass';
import Chip from '../../components/ui/Chip';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
  </div>
);

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function EventDate({ dateStr }) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return (
    <div className="w-12 h-12 rounded-xl bg-bg flex flex-col items-center justify-center shrink-0">
      <span className="text-label-s text-white font-bold uppercase leading-none">{MONTH_SHORT[d.getMonth()]}</span>
      <span className="text-headline-s text-white font-black leading-tight">{d.getDate()}</span>
    </div>
  );
}

function EventRSVPs({ eventId }) {
  const [rsvps,   setRsvps]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [totAtts, setTotAtts] = useState(0);

  useEffect(() => {
    apiClient.get(`/leader/events/${eventId}/rsvps`)
      .then(r => {
        const data = r.data?.data || [];
        setRsvps(data);
        setTotAtts(r.data?.total_attendees || data.reduce((s, x) => s + (x.attendee_count || 1), 0));
      })
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="px-5 pb-4 flex items-center gap-2 text-body-s text-bg/50">
      <div className="w-4 h-4 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
      Cargando confirmaciones…
    </div>
  );

  if (!rsvps?.length) return (
    <p className="px-5 pb-4 text-body-s text-bg/50">Sin confirmaciones aún.</p>
  );

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-label-s text-bg/50 uppercase tracking-widest">
          {rsvps.length} confirmaciones · {totAtts} asistentes estimados
        </span>
      </div>
      <div className="bg-bg/4 border border-bg/10 rounded-xl overflow-hidden divide-y divide-bg/8">
        {rsvps.map(r => (
          <div key={r.ID} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center shrink-0">
              <Icon name="person" className="w-[14px] h-[14px] text-white" stroke={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-s text-bg font-medium">{r.name}</p>
              <p className="text-label-s text-bg/50">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
            </div>
            <Chip color="secondary">{r.attendee_count || 1} pers.</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderEvents() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiClient.get(`/events/?_t=${Date.now()}`)
      .then(r => setEvents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
          <Icon name="calendar_month" className="w-[22px] h-[22px] text-white" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Eventos</h1>
          <p className="text-body-s text-bg/50 mt-0.5">Consulta quién se registró — crear o editar eventos lo hace un admin.</p>
        </div>
      </div>

      {loading ? <Spinner /> : events.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="calendar_month" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <p className="text-body-l text-bg font-medium">Sin eventos programados.</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {events.map(ev => (
            <div key={ev.ID} className="group">
              <div
                className="flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors cursor-pointer"
                onClick={() => setExpanded(p => p === ev.ID ? null : ev.ID)}
              >
                <EventDate dateStr={ev.date} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-l text-bg font-medium mb-1">{ev.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-body-s text-bg/50">
                    {ev.date && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="calendar_today" className="w-[14px] h-[14px]" stroke={1.8} />
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    )}
                    {ev.location && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="location_on" className="w-[14px] h-[14px]" stroke={1.8} />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.capacity > 0 && (
                    <Chip color={ev.is_full ? 'error' : 'default'} icon="groups" className="mt-2 w-fit">
                      {ev.attendee_count || 0}/{ev.capacity} cupos{ev.is_full ? ' · lleno' : ''}
                    </Chip>
                  )}
                </div>
                <span className="text-bg/40 shrink-0" style={{ transition: 'transform .2s', transform: expanded === ev.ID ? 'rotate(180deg)' : '' }}>
                  <Icon name="expand_more" className="w-[18px] h-[18px]" stroke={1.8} />
                </span>
              </div>
              {expanded === ev.ID && <EventRSVPs eventId={ev.ID} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
