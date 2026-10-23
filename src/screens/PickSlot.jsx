import { useEffect, useMemo, useState } from 'react';
import { useStore, uid } from '../data/store.jsx';
import { SPECIALTIES } from '../data/triage.js';
import { CENTER, getFreeSlots, windowForPriority, daysFromToday } from '../data/slots.js';
import { useI18n, niceDate, shortDate, relativeDay, floorText } from '../i18n/index.js';
import { Arrow, Button, Modal, Question } from '../components/ui.jsx';
import { IconCheck } from '../components/icons.jsx';

// Elegir día y hora. Sirve para reservar (triageId) o cambiar una cita (apptId).
// Al reservar tras enviar el formulario, esta pantalla también confirma «Hemos recibido su solicitud».
export default function PickSlot({ go, params }) {
  const { state, dispatch } = useStore();
  const { t, locale } = useI18n();
  const appt = params.apptId ? state.appointments.find((x) => x.id === params.apptId) : null;
  const triage = state.triages.find((x) => x.id === (appt?.triageId || params.triageId));
  const specialty = appt?.specialty || triage?.result.specialty;
  const priority = appt?.priority || triage?.result.priority || 'ORDINARIA';

  const [extra, setExtra] = useState(0);
  const takenIds = state.appointments.filter((x) => x.status !== 'ANULADA').map((x) => x.slot.id);
  const win = windowForPriority(priority);
  const days = useMemo(
    () => getFreeSlots(specialty, { ...win, maxDay: win.maxDay + extra, maxDays: 6 + extra / 3, takenIds }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specialty, priority, extra, state.appointments.length],
  );
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (!specialty || !SPECIALTIES[specialty]) return <main className="screen"><p>{t('pick.missing')}</p><Button onClick={() => go('home')}>{t('pick.home')}</Button></main>;
  const day = days[dayIdx];

  // Agrupar horas: mañana temprano / media mañana / mediodía
  const groups = day
    ? [
        [t('pick.g1'), day.slots.filter((s) => s.time < '10:00')],
        [t('pick.g2'), day.slots.filter((s) => s.time >= '10:00' && s.time < '12:00')],
        [t('pick.g3'), day.slots.filter((s) => s.time >= '12:00')],
      ].filter(([, l]) => l.length)
    : [];

  const confirm = () => {
    if (appt) {
      dispatch({ type: 'RESCHEDULE', id: appt.id, slot, note: 'Cambio pedido por el paciente' });
      go('booked', { apptId: appt.id, changed: true });
    } else {
      const newAppt = {
        id: uid('C'), triageId: triage.id, specialty, priority, visitType: triage.result.visitType,
        slot, status: 'CITADA', createdAt: new Date().toISOString(),
        history: [{ type: 'CREACION', at: new Date().toISOString(), note: 'Asignación tras triaje en la web' }],
      };
      dispatch({ type: 'BOOK', appt: newAppt });
      go('booked', { apptId: newAppt.id });
    }
  };

  const askCall = () => {
    dispatch({ type: 'UPDATE_TRIAGE', id: triage.id, patch: { status: 'EN_REVISION' } });
    go('callback');
  };

  return (
    <main className="screen">
      {!appt && (
        <div className="received" role="status">
          <span className="received-icon" aria-hidden="true"><IconCheck size={22} /></span>
          <div>
            <div className="received-title">{t('res.ok.title')}</div>
            <div className="received-text">{t('res.ok.text')}</div>
          </div>
        </div>
      )}
      <Question
        title={appt ? t('pick.titleChange') : t('pick.titleNew')}
        help={t('pick.help')}
      />

      <h2 className="section-title">{t('pick.day')}</h2>
      <div className="days" role="radiogroup" aria-label={t('pick.days')}>
        {days.map((d, idx) => (
          <button key={d.date} type="button" role="radio" aria-checked={idx === dayIdx}
            className={`day ${idx === dayIdx ? 'is-selected' : ''}`} onClick={() => { setDayIdx(idx); setSlot(null); }}>
            <span className="day-name">{shortDate(d.date, locale)}</span>
            <span className="day-rel">{relativeDay(t, daysFromToday(d.date))}</span>
            <span className="day-count">{t('pick.free', { count: d.slots.length })}</span>
          </button>
        ))}
      </div>
      {extra < 30 && (
        <button type="button" className="link more" onClick={() => setExtra(extra + 15)}>{t('pick.more')}</button>
      )}

      {day && (
        <>
          <h2 className="section-title">{t('pick.time', { date: niceDate(day.date, locale) })}</h2>
          {groups.map(([label, list]) => (
            <div key={label} className="time-group">
              <div className="muted small">{label}</div>
              <div className="times" role="radiogroup" aria-label={label}>
                {list.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={slot?.id === s.id}
                    className={`time ${slot?.id === s.id ? 'is-selected' : ''}`} onClick={() => setSlot(s)}>
                    {s.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {appt ? (
        <div className="stack">
          <Button variant="ghost" icon={<Arrow back />} onClick={() => go('appts')}>{t('ui.back')}</Button>
        </div>
      ) : (
        <>
          <div className="stack">
            <Button variant="secondary" icon="📞" onClick={askCall}>{t('res.callMe')}</Button>
            <Button variant="ghost" onClick={() => go('home')}>{t('res.home')}</Button>
          </div>
          <p className="muted small center">{t('res.worse', { phone: CENTER.phone })}</p>
        </>
      )}

      <Modal open={Boolean(slot)} title={t('pick.confirmTitle')} onClose={() => setSlot(null)}>
        {slot && (
          <>
            <div className="summary">
              <div className="summary-date">{niceDate(slot.date, locale)}</div>
              <div className="summary-time">{t('pick.at', { time: slot.time })}</div>
              <div>{slot.doctor}</div>
              <div className="muted">{t('room', { room: slot.room })} · {floorText(t, slot.floor)}</div>
            </div>
            <div className="stack">
              <Button size="lg" icon="✓" onClick={confirm}>{t('pick.yes')}</Button>
              <Button variant="ghost" onClick={() => setSlot(null)}>{t('pick.no')}</Button>
            </div>
          </>
        )}
      </Modal>
    </main>
  );
}
