import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { SPECIALTIES, CONTACT } from '../data/triage.js';
import { CENTER } from '../data/slots.js';
import { useI18n, label } from '../i18n/index.js';
import { Button, Listen } from '../components/ui.jsx';
import PickSlot from './PickSlot.jsx';

export function Emergency({ go }) {
  const { t } = useI18n();
  return (
    <main className="screen emergency">
      <div className="emergency-icon" aria-hidden="true">🚑</div>
      <h1 tabIndex={-1}>{t('em.title')}</h1>
      <p className="lead">{t('em.lead1')} <strong>{t('em.lead2')}</strong> {t('em.lead3')}</p>
      <a className="btn btn-danger btn-lg btn-block" href="tel:112"><span className="btn-icon">📞</span><span>{t('em.call')}</span></a>
      <ul className="emergency-tips">
        <li>{t('em.tip1')}</li>
        <li>{t('em.tip2')}</li>
        <li>{t('em.tip3')}</li>
      </ul>
      <Listen text={t('em.speak')} />
      <Button variant="ghost" onClick={() => go('home')}>{t('res.home')}</Button>
    </main>
  );
}

export function Result({ go, params }) {
  const { state } = useStore();
  const { t } = useI18n();
  const triage = state.triages.find((x) => x.id === params.triageId);
  if (!triage) return <main className="screen"><p>{t('res.notFound')}</p><Button onClick={() => go('home')}>{t('pick.home')}</Button></main>;

  const r = triage.result;
  // Al paciente no le mostramos ni la consulta asignada ni la prioridad: eso lo revisa el personal.
  // No mostramos el nombre del paciente en pantalla
  const thanks = t('res.thanksNoName');

  // No sabemos qué consulta le corresponde: lo decide un profesional y se le avisa
  if (r.specialty === 'UNK' || !SPECIALTIES[r.specialty]) {
    const p = triage.patient;
    const contacts = p.contacts || (p.contact ? [p.contact] : []);
    const byPhone = contacts.includes('LLAMADA') && p.phone;
    const method = contacts.map((id) => label(t, 'contact', CONTACT.find((c) => c.id === id)).toLowerCase()).join(', ');
    return (
      <main className="screen">
        <p className="eyebrow">{t('res.eyebrow')}</p>
        <h1 tabIndex={-1}>{thanks}</h1>
        <section className="card result-card">
          <div className="result-row">
            <span className="result-icon" aria-hidden="true">🧑‍⚕️</span>
            <div className="result-spec">{t('res.unk.title')}</div>
          </div>
          <p>{t('res.unk.text')}</p>
          <div className="result-priority">
            <p><strong>{byPhone ? t('res.unk.phone', { phone: p.phone }) : t('res.unk.contact', { method })}</strong></p>
          </div>
        </section>
        <Listen text={`${t('res.unk.title')}. ${t('res.unk.text')}`} />
        <div className="stack">
          <Button size="lg" onClick={() => go('home')}>{t('res.home')}</Button>
        </div>
        <p className="muted small center">{t('res.worse', { phone: CENTER.phone })}</p>
      </main>
    );
  }

  // «Hemos recibido su solicitud» ya no es una pantalla aparte: va arriba de la elección de día y hora
  return <PickSlot go={go} params={{ triageId: triage.id }} />;
}

export function Callback({ go }) {
  const { state, dispatch } = useStore();
  const { t } = useI18n();
  const p = state.patient || {};
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 9;
  return (
    <main className="screen center-screen">
      <div className="big-check" aria-hidden="true">📞</div>
      <h1 tabIndex={-1}>{t('cb.title')}</h1>
      {p.phone ? (
        <p className="lead">{t('cb.textPhone', { phone: p.phone })}</p>
      ) : (
        <>
          <p className="lead">{t('cb.askPhone')}</p>
          <label className="field callback-phone">
            <span>{t('tr.contact.phone')}</span>
            <input inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('tr.contact.phonePh')} />
          </label>
          <Button size="lg" disabled={!valid} onClick={() => dispatch({ type: 'SET_PATIENT', patient: { phone } })}>{t('cb.save')}</Button>
        </>
      )}
      <Button size={p.phone ? 'lg' : undefined} variant={p.phone ? 'primary' : 'ghost'} onClick={() => go('home')}>{t('res.home')}</Button>
    </main>
  );
}
