import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { CENTER, daysFromToday } from '../data/slots.js';
import { useI18n, tEs, niceDate, relativeDay, visitName, floorText, dateTime } from '../i18n/index.js';
import { Arrow, Button, IconCalendarX, Modal } from '../components/ui.jsx';
import SaveOptions from '../components/SaveOptions.jsx';

const STATUS_CLS = { CITADA: 'st-info', CONFIRMADA: 'st-ok', ANULADA: 'st-off' };

export function ApptSummary({ appt, big }) {
  const { t, locale } = useI18n();
  return (
    <div className={`appt-summary ${big ? 'big' : ''}`}>
      <div className="appt-date">
        <span className="appt-day">{niceDate(appt.slot.date, locale)}</span>
        <span className="appt-time">{t('time', { time: appt.slot.time })}</span>
        <span className="appt-rel">{relativeDay(t, daysFromToday(appt.slot.date))}</span>
      </div>
      <div className="appt-info">
        <div className="appt-spec"><span aria-hidden="true">🩺</span> {visitName(t)}</div>
        <div>{appt.slot.doctor}</div>
        <div className="muted">{CENTER.name}</div>
        <div className="muted">{CENTER.address} · {t('room', { room: appt.slot.room })} · {floorText(t, appt.slot.floor)}</div>
      </div>
    </div>
  );
}

function Prepare({ access }) {
  const { t } = useI18n();
  const tips = ['prep.1', 'prep.2', 'prep.3', 'prep.4'];
  if (access?.includes('MOVILIDAD_REDUCIDA')) tips.push('prep.mob');
  if (access?.includes('INTERPRETE')) tips.push('prep.int');
  return (
    <details className="card prepare">
      <summary><span aria-hidden="true">📋</span> {t('prep.title')}</summary>
      <ul>{tips.map((k) => <li key={k}>{t(k)}</li>)}</ul>
    </details>
  );
}

export function Booked({ go, params }) {
  const { state } = useStore();
  const { t } = useI18n();
  const appt = state.appointments.find((x) => x.id === params.apptId);
  if (!appt) return null;
  return (
    <main className="screen">
      <div className="center-screen">
        <div className="big-check ok" aria-hidden="true">✓</div>
        <h1 tabIndex={-1}>{params.changed ? t('bk.changed') : t('bk.booked')}</h1>
        <p className="lead">{t('bk.reminder')}</p>
      </div>
      <section className="card"><ApptSummary appt={appt} big /></section>
      <section className="card save-card no-print">
        <h2>{t('save.title')}</h2>
        <SaveOptions appt={appt} />
      </section>
      <Prepare access={state.patient?.access} />
      <div className="stack">
        <Button size="lg" onClick={() => go('appts')}>{t('bk.myAppts')}</Button>
        <Button variant="ghost" onClick={() => go('home')}>{t('res.home')}</Button>
      </div>
    </main>
  );
}

const CANCEL_REASONS = ['my.r1', 'my.r2', 'my.r3', 'my.r4'];

export function MyAppointments({ go }) {
  const { state, dispatch } = useStore();
  const { t, locale } = useI18n();
  const [cancel, setCancel] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(null);
  const list = [...state.appointments].sort((a, b) => (a.slot.date + a.slot.time).localeCompare(b.slot.date + b.slot.time));
  const upcoming = list.filter((a) => a.status !== 'ANULADA' && daysFromToday(a.slot.date) >= 0);
  const past = list.filter((a) => a.status === 'ANULADA' || daysFromToday(a.slot.date) < 0);
  const offers = state.notifications.filter((n) => n.type === 'OFERTA_ADELANTO' && n.status === 'PENDIENTE');

  // Imprimir: primero se cierra la ventana para que no salga en el papel
  const printFromModal = () => { setSaving(null); setTimeout(() => window.print(), 150); };

  return (
    <main className="screen">
      <h1 tabIndex={-1}>{t('my.title')}</h1>

      {offers.map((o) => <OfferCard key={o.id} offer={o} />)}

      {!upcoming.length && (
        <section className="card empty">
          <p className="lead">{t('my.empty')}</p>
          <Button size="lg" icon="🩺" onClick={() => go('triage')}>{t('my.book')}</Button>
        </section>
      )}

      {upcoming.map((a) => (
        <section key={a.id} className="card appt-card">
          <div className="appt-top">
            <span className={`status ${STATUS_CLS[a.status]}`}>{t(`st.${a.status}`)}</span>
          </div>
          <ApptSummary appt={a} />
          <div className="appt-actions">
            {a.status === 'CITADA' && (
              <Button icon="👍" onClick={() => dispatch({ type: 'CONFIRM_ATTENDANCE', id: a.id })}>{t('my.confirm')}</Button>
            )}
            <Button variant="secondary" icon="📲" onClick={() => setSaving(a)}>{t('my.save')}</Button>
            <Button variant="secondary" icon="🔁" onClick={() => go('pick', { apptId: a.id })}>{t('my.change')}</Button>
            <Button variant="outline-danger" icon={<IconCalendarX />} onClick={() => { setCancel(a); setReason(''); }}>{t('my.cancel')}</Button>
          </div>
          <Prepare access={state.patient?.access} />
        </section>
      ))}

      {past.length > 0 && (
        <details className="past">
          <summary>{t('my.past', { count: past.length })}</summary>
          {past.map((a) => (
            <div key={a.id} className="card past-card">
              <span className={`status ${STATUS_CLS[a.status]}`}>{a.status === 'ANULADA' ? t('st.ANULADA') : t('st.past')}</span>
              <ApptSummary appt={a} />
            </div>
          ))}
        </details>
      )}

      <div className="stack">
        <Button variant="ghost" icon={<Arrow back />} onClick={() => go('home')}>{t('res.home')}</Button>
      </div>

      <Modal open={Boolean(saving)} title={t('save.modalTitle')} onClose={() => setSaving(null)}>
        {saving && <SaveOptions appt={saving} onPrint={printFromModal} />}
      </Modal>

      <Modal open={Boolean(cancel)} title={t('my.cancelTitle')} onClose={() => setCancel(null)}>
        {cancel && (
          <div className="cancel-appt">
            <span className="cancel-appt-icon"><IconCalendarX /></span>
            <div>
              <strong>{visitName(t)}</strong>
              <div>{niceDate(cancel.slot.date, locale)} · {t('time', { time: cancel.slot.time })}</div>
            </div>
          </div>
        )}
        <p>{t('my.cancelText')}</p>
        <div className="choices">
          {CANCEL_REASONS.map((r) => (
            <button key={r} type="button" className={`chip ${reason === r ? 'is-selected' : ''}`} onClick={() => setReason(r)}>{t(r)}</button>
          ))}
        </div>
        <div className="stack">
          {/* El motivo se guarda en español para el personal del centro */}
          <Button variant="danger" size="lg" icon={<IconCalendarX />} onClick={() => { dispatch({ type: 'CANCEL', id: cancel.id, reason: reason ? tEs(reason) : 'Paciente cancela' }); setCancel(null); }}>{t('my.cancelYes')}</Button>
          <Button variant="ghost" onClick={() => setCancel(null)}>{t('my.cancelNo')}</Button>
        </div>
      </Modal>
    </main>
  );
}

// Oferta de adelanto: un hueco se ha liberado antes que su cita
export function OfferCard({ offer }) {
  const { state, dispatch } = useStore();
  const { t, locale } = useI18n();
  const appt = state.appointments.find((a) => a.id === offer.apptId);
  if (!appt || appt.status === 'ANULADA') return null;
  const accept = () => {
    dispatch({ type: 'RESPOND_OFFER', id: offer.id, status: 'ACEPTA' });
    dispatch({ type: 'RESCHEDULE', id: appt.id, slot: offer.slot, note: 'Acepta oferta de adelanto', fromOffer: true });
  };
  return (
    <section className="card offer" aria-live="polite">
      <div className="offer-head"><span aria-hidden="true">⏩</span> {t('off.head')}</div>
      <p>{t('off.text', { date: niceDate(appt.slot.date, locale) })}</p>
      <div className="offer-new">{t('off.new', { date: niceDate(offer.slot.date, locale), time: offer.slot.time })}</div>
      <p className="muted small">{offer.slot.doctor} · {t('room', { room: offer.slot.room })}</p>
      <div className="appt-actions">
        <Button size="lg" icon="✓" onClick={accept}>{t('off.yes')}</Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'RESPOND_OFFER', id: offer.id, status: 'RECHAZA' })}>{t('off.no')}</Button>
      </div>
    </section>
  );
}

const N_ICON = { CONFIRMACION_CITA: '✅', RECORDATORIO: '⏰', AVISO_CAMBIO_CITA: '🔁', OFERTA_ADELANTO: '⏩' };

export function Notifications({ go }) {
  const { state } = useStore();
  const { t, locale } = useI18n();
  const list = state.notifications;
  return (
    <main className="screen">
      <h1 tabIndex={-1}>{t('nt.title')}</h1>
      {!list.length && <p className="lead">{t('nt.empty')}</p>}
      {list.map((n) => {
        if (n.type === 'OFERTA_ADELANTO' && n.status === 'PENDIENTE') return <OfferCard key={n.id} offer={n} />;
        const appt = state.appointments.find((a) => a.id === n.apptId);
        const text = n.type === 'OFERTA_ADELANTO'
          ? (n.status === 'ACEPTA' ? t('nt.offerYes') : t('nt.offerNo'))
          : t(`nt.${n.type}.text`);
        return (
          <section key={n.id} className={`card notif ${n.read ? '' : 'unread'}`}>
            <span className="notif-icon" aria-hidden="true">{N_ICON[n.type]}</span>
            <div>
              <div className="notif-title">{t(`nt.${n.type}`)}</div>
              <div>{text}</div>
              {appt && <div className="muted small">{visitName(t)} · {niceDate(appt.slot.date, locale)} {t('time', { time: appt.slot.time })}</div>}
              <div className="muted small">{dateTime(n.at, locale)}</div>
            </div>
          </section>
        );
      })}
      <div className="stack">
        <Button variant="ghost" icon={<Arrow back />} onClick={() => go('home')}>{t('res.home')}</Button>
      </div>
    </main>
  );
}
