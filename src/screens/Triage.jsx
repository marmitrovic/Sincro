import { useEffect, useState } from 'react';
import { useStore, uid } from '../data/store.jsx';
import {
  AREAS, SYMPTOMS, DURATIONS, INTENSITY, EVOLUTION, RED_FLAGS, ACCESSIBILITY, CONTACT, evaluateTriage,
} from '../data/triage.js';
import {
  lookupPatient, normalizeCard, formatCard, DOC_TYPES, DOC_MAX, CARD_MAX, parseDob, ageFromDob, formatDob, normalizeDoc, isValidDoc, maskDoc, isValidPhone, isValidEmail, isValidAddress,
} from '../data/patients.js';
import { CENTER } from '../data/slots.js';
import { useI18n, label } from '../i18n/index.js';
import { Choice, ChooseHint, NavBar, Progress, Question } from '../components/ui.jsx';

// 9 pasos: la tarjeta sanitaria y un documento (DNI, NIE o pasaporte) sustituyen a nombre y edad,
// y «desde cuándo», «cómo va» y «cuánto molesta» van juntas en una sola pantalla.
// No preguntamos si ya le tratan en el hospital: eso lo comprueba el personal.
const STEPS = ['tarjeta', 'alarma', 'zona', 'sintomas', 'texto', 'como', 'necesidades', 'contacto', 'revisar'];
const S = Object.fromEntries(STEPS.map((s, n) => [s, n]));
const REVIEW = STEPS.indexOf('revisar');

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function Triage({ go }) {
  const { state, dispatch } = useStore();
  const { t, lang } = useI18n();
  const p = state.patient || {};
  const [i, setI] = useState(0);
  const [fromReview, setFromReview] = useState(false);
  const [a, setA] = useState({
    card: p.card ? formatCard(p.card) : '', docType: p.docType || 'DNI', docNumber: p.docNumber || '',
    dobD: p.dob ? p.dob.slice(8, 10) : '', dobM: p.dob ? p.dob.slice(5, 7) : '', dobY: p.dob ? p.dob.slice(0, 4) : '',
    redFlags: [], noFlags: false, area: null, symptoms: [], text: '',
    duration: null, evolution: null, intensity: null, followUp: 'no',
    access: p.access || [],
    // Se pueden elegir varias formas de aviso, cada una con su dato
    contacts: p.contacts || (p.contact ? [p.contact] : []),
    phone: p.phone || '', email: p.email || '', address: p.address || '',
  });
  const set = (patch) => setA((s) => ({ ...s, ...patch }));
  const toggle = (key, id) => set({ [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id] });

  const step = STEPS[i];
  const found = lookupPatient(a.card);
  // La fecha de nacimiento es obligatoria y tiene que ser una fecha real y pasada
  const dob = parseDob(a.dobD, a.dobM, a.dobY);
  const dobOk = Boolean(dob);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.q-title')?.focus();
  }, [i]);

  const back = () => (i === 0 ? go('home') : setI(i - 1));
  // Si viene de «Revise sus respuestas», al continuar vuelve allí directamente
  const next = () => {
    const needsSymptoms = step === 'zona' && a.symptoms.length === 0;
    if (fromReview && !needsSymptoms) { setFromReview(false); setI(REVIEW); } else setI(i + 1);
  };
  const edit = (s) => { setFromReview(true); setI(s); };

  const submit = () => {
    // Solo se guardan los datos de contacto de las formas de aviso elegidas
    const has = (id) => a.contacts.includes(id);
    const contactData = {
      contacts: a.contacts,
      phone: has('SMS') || has('LLAMADA') ? a.phone.trim() : '',
      email: has('EMAIL') ? a.email.trim() : '',
      address: has('CARTA') ? a.address.trim() : '',
    };
    const patient = {
      card: found.card, docType: a.docType, docNumber: normalizeDoc(a.docNumber),
      name: found.name, age: ageFromDob(dob), dob, access: a.access, ...contactData,
    };
    dispatch({ type: 'SET_PATIENT', patient });
    const answers = { ...a, ...contactData, card: found.card, docNumber: patient.docNumber, dob: patient.dob, lang };
    const result = evaluateTriage(answers, patient);
    // Si no sabemos qué consulta le corresponde, lo decide un profesional (no el paciente)
    const status = result.emergency ? 'DERIVADO_URGENCIAS' : result.specialty === 'UNK' ? 'EN_REVISION' : 'PENDIENTE_CITA';
    const triage = { id: uid('TR'), createdAt: new Date().toISOString(), answers, patient, result, status };
    dispatch({ type: 'ADD_TRIAGE', triage });
    // Sin señales de alarma pasamos directamente a elegir día y hora (con el aviso «Hemos recibido su solicitud»).
    // Si un profesional tiene que decidir la consulta, se muestra esa pantalla en su lugar.
    go(result.emergency ? 'emergency' : status === 'EN_REVISION' ? 'result' : 'pick', { triageId: triage.id, fresh: true });
  };

  let body, canNext = true, nextLabel, onNext = next, nextVariant = 'primary';

  switch (step) {
    case 'tarjeta': {
      const typed = normalizeCard(a.card).length;
      const docTyped = normalizeDoc(a.docNumber).length;
      const docOk = isValidDoc(a.docType, a.docNumber);
      canNext = Boolean(found) && docOk && dobOk;
      const dobTyped = a.dobY.trim().length === 4;
      const docMax = DOC_MAX[a.docType];
      // Fecha: al completar una casilla pasa sola a la siguiente; con «borrar» en una vacía vuelve atrás
      const DOB = [['dobD', 2, 'bday-day'], ['dobM', 2, 'bday-month'], ['dobY', 4, 'bday-year']];
      const dobPh = t('tr.card.dobPh').split('/');
      const dobLabels = [t('tr.card.dobDay'), t('tr.card.dobMonth'), t('tr.card.dobYear')];
      const dobInput = ([key, max, auto], n) => (
        <input
          key={key} id={`dob-${n}`} className={`dob-${key}`} inputMode="numeric" autoComplete={auto} maxLength={max}
          placeholder={dobPh[n]} aria-label={dobLabels[n]} value={a[key]}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, max);
            set({ [key]: v });
            if (v.length === max && n < 2) document.getElementById(`dob-${n + 1}`)?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !a[key] && n > 0) document.getElementById(`dob-${n - 1}`)?.focus();
            if (e.key === 'Enter' && canNext) next();
          }}
        />
      );
      body = (
        <>
          <Question title={t('tr.card.title')} help={t('tr.card.help')} />
          <div className="tsi" aria-hidden="true">
            <div className="tsi-top"><span className="tsi-mark">✚</span> {t('tr.card.cardTitle')}</div>
            <div className="tsi-lines"><span /><span /></div>
            <div className="tsi-code">BBBB 1234 5678 9012</div>
            <div className="tsi-pointer">▲ {t('tr.card.thisCode')}</div>
          </div>
          <label className="field">
            <span>{t('tr.card.label')}</span>
            <input
              className="input-card" value={a.card} placeholder={t('tr.card.placeholder')}
              autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={CARD_MAX + Math.floor((CARD_MAX - 1) / 4)}
              aria-describedby="card-where" aria-invalid={typed >= 8 && !found}
              onChange={(e) => set({ card: formatCard(normalizeCard(e.target.value).slice(0, CARD_MAX)) })}
            />
          </label>
          <p id="card-where" className="muted small card-where">{t('tr.card.where')}</p>
          {typed >= 8 && !found && <p className="field-error" role="alert">{t('tr.card.invalid')}</p>}
          {/* Solo confirmamos que la tarjeta es válida: no mostramos nombre ni edad */}
          {found && (
            <div className="found" role="status">
              <span className="found-icon" aria-hidden="true">✓</span>
              <div className="found-body">
                <div className="found-title">{t('tr.card.valid')}</div>
                <div className="found-code" dir="ltr">{formatCard(found.card)}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ card: '' })}>{t('tr.card.edit')}</button>
            </div>
          )}

          {found && (
            <fieldset className="doc-box">
              <legend>{t('tr.card.docTitle')}</legend>
              <p className="muted small">{t('tr.card.docHelp')}</p>
              <div className="seg seg-3" role="radiogroup" aria-label={t('tr.card.docType')}>
                {DOC_TYPES.map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={a.docType === d}
                    className={`seg-btn ${a.docType === d ? 'is-selected' : ''}`} onClick={() => set({ docType: d, docNumber: normalizeDoc(a.docNumber).slice(0, DOC_MAX[d]) })}>
                    {t(`doc.${d}`)}
                  </button>
                ))}
              </div>
              <label className="field field-gap">
                <span>{t('tr.card.docNumber', { doc: t(`doc.${a.docType}`) })}</span>
                <input
                  className="input-card" value={a.docNumber} placeholder={t(`tr.card.docPh.${a.docType}`)}
                  autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={docMax}
                  aria-invalid={docTyped >= 6 && !docOk}
                  onChange={(e) => set({ docNumber: normalizeDoc(e.target.value).slice(0, docMax) })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && docOk) { if (dobOk) next(); else document.getElementById('dob-0')?.focus(); } }}
                />
              </label>
              {docTyped >= 6 && !docOk && <p className="field-error" role="alert">{t(`tr.card.docBad.${a.docType}`)}</p>}
              {docOk && <p className="field-ok" role="status">✓ {t('tr.card.docValid')}</p>}

              {/* Fecha de nacimiento (obligatoria): una sola fila compacta DD / MM / AAAA */}
              <div className="dob-field">
                <span id="dob-label" className="dob-label">{t('tr.card.dobTitle')}</span>
                <div role="group" aria-labelledby="dob-label" dir="ltr"
                  className={`dob-group ${dob ? 'is-ok' : ''} ${dobTyped && !dobOk ? 'is-bad' : ''}`}>
                  {DOB.map((d, n) => [
                    n > 0 && <span key={`s${n}`} className="dob-sep" aria-hidden="true">/</span>,
                    dobInput(d, n),
                  ])}
                  {dob && <span className="dob-check" aria-hidden="true">✓</span>}
                </div>
                {dobTyped && !dobOk && <p className="field-error" role="alert">{t('tr.card.dobBad')}</p>}
              </div>
            </fieldset>
          )}

          <p className="muted small">
            <a href={`tel:${CENTER.phone.replace(/\s/g, '')}`}>{t('tr.card.noCard', { phone: CENTER.phone })}</a>
          </p>
          <p className="demo-note small">{t('tr.card.demo')}</p>
        </>
      );
      break;
    }

    case 'alarma':
      canNext = a.noFlags || a.redFlags.length > 0;
      if (a.redFlags.length) { nextLabel = t('tr.alarm.go'); onNext = submit; nextVariant = 'danger'; }
      body = (
        <>
          <Question title={t('tr.alarm.title')} help={t('tr.alarm.help')} />
          <ChooseHint multi />
          <div className="choices">
            {RED_FLAGS.map((f) => (
              <Choice key={f.id} multi danger icon={f.icon} label={label(t, 'flag', f)} selected={a.redFlags.includes(f.id)}
                onClick={() => set({ redFlags: a.redFlags.includes(f.id) ? a.redFlags.filter((x) => x !== f.id) : [...a.redFlags, f.id], noFlags: false })} />
            ))}
            <Choice icon="👍" label={t('tr.alarm.none')} selected={a.noFlags} onClick={() => set({ noFlags: true, redFlags: [] })} />
          </div>
        </>
      );
      break;

    case 'zona':
      canNext = Boolean(a.area);
      body = (
        <>
          <Question title={t('tr.area.title')} help={t('tr.area.help')} />
          <ChooseHint />
          <div className="choices grid">
            {AREAS.map((z) => (
              <Choice key={z.id} icon={z.icon} label={label(t, 'area', z)} selected={a.area === z.id} onClick={() => set({ area: z.id, symptoms: a.area === z.id ? a.symptoms : [] })} />
            ))}
          </div>
        </>
      );
      break;

    case 'sintomas':
      canNext = a.symptoms.length > 0;
      body = (
        <>
          <Question title={t('tr.sym.title')} help={t('tr.sym.help')} />
          <ChooseHint multi />
          <div className="choices">
            {(SYMPTOMS[a.area] || []).map((s) => (
              <Choice key={s.id} multi label={label(t, 'sym', s)} selected={a.symptoms.includes(s.id)} onClick={() => toggle('symptoms', s.id)} />
            ))}
          </div>
        </>
      );
      break;

    case 'texto':
      nextLabel = a.text.trim() ? undefined : t('tr.text.skip');
      body = (
        <>
          <Question title={t('tr.text.title')} help={t('tr.text.help')} />
          <label className="field">
            <span>{t('tr.text.label')}</span>
            <textarea rows={6} value={a.text} onChange={(e) => set({ text: e.target.value })} placeholder={t('tr.text.placeholder')} />
          </label>
        </>
      );
      break;

    case 'como': {
      canNext = Boolean(a.duration) && Boolean(a.evolution) && a.intensity !== null;
      const qs = [
        { key: 'duration', title: t('tr.how.q1'), cls: 'seg-4', items: DURATIONS.map((d) => ({ id: d.id, label: label(t, 'dur', d) })) },
        { key: 'evolution', title: t('tr.how.q2'), cls: 'seg-3', items: EVOLUTION.map((d) => ({ id: d.id, label: label(t, 'evo', d), icon: d.icon })) },
        { key: 'intensity', title: t('tr.how.q3'), cls: 'seg-4 seg-faces', items: INTENSITY.map((d) => ({ id: d.id, label: label(t, 'int', d), icon: d.face })) },
      ];
      // Al responder una pregunta, la siguiente sin responder se coloca a la vista
      const answer = (key, id, n) => {
        set({ [key]: id });
        const nextQ = qs.findIndex((q, k) => k > n && a[q.key] === null);
        if (nextQ > -1) {
          setTimeout(() => document.getElementById(`mq-${nextQ}`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }), 60);
        }
      };
      body = (
        <>
          <Question title={t('tr.how.title')} help={t('tr.how.help')}
            speakText={`${t('tr.how.title')}. ${qs.map((q, n) => `${n + 1}: ${q.title} ${q.items.map((x) => x.label).join(', ')}.`).join(' ')}`} />
          {qs.map((q, n) => {
            const value = a[q.key];
            const done = value !== null;
            return (
              <fieldset key={q.key} id={`mq-${n}`} className={`mini-q ${done ? 'is-done' : ''}`}>
                <legend>
                  <span className="mini-n" aria-hidden="true">{done ? '✓' : n + 1}</span>
                  {q.title}
                  {done && <span className="sr-only"> · {t('tr.how.done')}</span>}
                </legend>
                <div className={`seg ${q.cls}`} role="radiogroup" aria-label={q.title}>
                  {q.items.map((it) => (
                    <button key={it.id} type="button" role="radio" aria-checked={value === it.id}
                      className={`seg-btn ${value === it.id ? 'is-selected' : ''}`} onClick={() => answer(q.key, it.id, n)}>
                      {it.icon && <span className="seg-icon" aria-hidden="true">{it.icon}</span>}
                      <span>{it.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </>
      );
      break;
    }

    case 'necesidades':
      canNext = a.access.length > 0;
      body = (
        <>
          <Question title={t('tr.needs.title')} help={t('tr.needs.help')} />
          <ChooseHint multi />
          <div className="choices">
            {ACCESSIBILITY.map((x) => (
              <Choice key={x.id} multi icon={x.icon} label={label(t, 'acc', x)} selected={a.access.includes(x.id)}
                onClick={() => {
                  if (x.id === 'NINGUNA') return set({ access: ['NINGUNA'] });
                  const rest = a.access.filter((v) => v !== 'NINGUNA');
                  set({ access: rest.includes(x.id) ? rest.filter((v) => v !== x.id) : [...rest, x.id] });
                }} />
            ))}
          </div>
        </>
      );
      break;

    case 'contacto': {
      const has = (id) => a.contacts.includes(id);
      const needPhone = has('SMS') || has('LLAMADA');
      const okPhone = isValidPhone(a.phone);
      const okEmail = isValidEmail(a.email);
      const okAddress = isValidAddress(a.address);
      canNext = a.contacts.length > 0 && (!needPhone || okPhone) && (!has('EMAIL') || okEmail) && (!has('CARTA') || okAddress);
      // Al marcar una opción que necesita un dato, llevamos al paciente a ese campo
      const pick = (id) => {
        const on = !has(id);
        set({ contacts: on ? [...a.contacts, id] : a.contacts.filter((x) => x !== id) });
        const field = { SMS: 'f-phone', LLAMADA: 'f-phone', EMAIL: 'f-email', CARTA: 'f-address' }[id];
        if (on && field) {
          setTimeout(() => {
            const el = document.getElementById(field);
            el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
            el?.focus({ preventScroll: true });
          }, 80);
        }
      };
      const err = (value, ok, key) => (value.trim() && !ok ? <p className="field-error" role="alert">{t(key)}</p> : null);
      body = (
        <>
          <Question title={t('tr.contact.title')} help={t('tr.contact.help')} />
          <ChooseHint multi />
          <div className="choices grid">
            {CONTACT.map((x) => <Choice key={x.id} multi icon={x.icon} label={label(t, 'contact', x)} selected={has(x.id)} onClick={() => pick(x.id)} />)}
          </div>
          {(needPhone || has('EMAIL') || has('CARTA')) && (
            <section className="contact-details">
              <h2>{t('tr.contact.details')}</h2>
              {needPhone && (
                <label className="field">
                  <span><span aria-hidden="true">📞</span> {t('tr.contact.phone')}</span>
                  <input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={a.phone}
                    onChange={(e) => set({ phone: e.target.value })} placeholder={t('tr.contact.phonePh')} className="input-short" />
                  {err(a.phone, okPhone, 'tr.contact.phoneBad')}
                </label>
              )}
              {has('EMAIL') && (
                <label className="field">
                  <span><span aria-hidden="true">✉️</span> {t('tr.contact.email')}</span>
                  <input id="f-email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={a.email}
                    onChange={(e) => set({ email: e.target.value })} placeholder={t('tr.contact.emailPh')} />
                  {err(a.email, okEmail, 'tr.contact.emailBad')}
                </label>
              )}
              {has('CARTA') && (
                <label className="field">
                  <span><span aria-hidden="true">📮</span> {t('tr.contact.address')}</span>
                  <textarea id="f-address" rows={3} autoComplete="street-address" value={a.address}
                    onChange={(e) => set({ address: e.target.value })} placeholder={t('tr.contact.addressPh')} />
                  {err(a.address, okAddress, 'tr.contact.addressBad')}
                </label>
              )}
            </section>
          )}
        </>
      );
      break;
    }

    case 'revisar': {
      nextLabel = t('tr.review.send');
      onNext = submit;
      const find = (list, id) => list.find((x) => x.id === id);
      const rows = [
        ['who', found ? `${formatCard(found.card)} · ${t(`doc.${a.docType}`)} ${maskDoc(a.docNumber)}` : '—', S.tarjeta],
        ...(dob ? [['dob', formatDob(dob), S.tarjeta]] : []),
        ['area', label(t, 'area', find(AREAS, a.area)), S.zona],
        ['sym', (SYMPTOMS[a.area] || []).filter((s) => a.symptoms.includes(s.id)).map((s) => label(t, 'sym', s)).join(' · '), S.sintomas],
        ['text', a.text || t('tr.review.textEmpty'), S.texto],
        ['how', [label(t, 'dur', find(DURATIONS, a.duration)), label(t, 'evo', find(EVOLUTION, a.evolution)), label(t, 'int', find(INTENSITY, a.intensity))].join(' · '), S.como],
        ['needs', a.access.map((x) => label(t, 'acc', find(ACCESSIBILITY, x))).join(' · '), S.necesidades],
        ['contact', a.contacts.map((id) => {
          const detail = { SMS: a.phone, LLAMADA: a.phone, EMAIL: a.email, CARTA: a.address }[id];
          return label(t, 'contact', find(CONTACT, id)) + (detail ? `: ${detail.trim()}` : '');
        }).join('\n'), S.contacto],
      ];
      body = (
        <>
          <Question title={t('tr.review.title')} help={t('tr.review.help')} />
          <dl className="review">
            {rows.map(([k, v, s]) => (
              <div className="review-row" key={k}>
                <dt>{t(`tr.review.${k}`)}</dt>
                <dd>{v}</dd>
                <button type="button" className="link" onClick={() => edit(s)}>{t('tr.review.change')}</button>
              </div>
            ))}
          </dl>
          <p className="muted small">{t('tr.review.disclaimer')}</p>
        </>
      );
      break;
    }
    default:
      body = null;
  }

  return (
    <main className="screen with-navbar">
      <Progress step={i + 1} total={STEPS.length} />
      {body}
      <NavBar onBack={back} onNext={onNext} nextDisabled={!canNext} nextLabel={nextLabel} nextVariant={nextVariant} hint={t(step === 'tarjeta' || (step === 'contacto' && a.contacts.length) ? 'ui.needData' : 'ui.needChoice')} backLabel={i === 0 ? t('ui.exit') : undefined} />
    </main>
  );
}
