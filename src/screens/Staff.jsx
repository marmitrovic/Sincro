import { useMemo, useState } from 'react';
import { useStore, uid } from '../data/store.jsx';
import { SPECIALTIES, PRIORITY_INFO, SYMPTOMS, DURATIONS, INTENSITY, EVOLUTION, ACCESSIBILITY, CONTACT, AREAS, RED_FLAGS, evaluateTriage } from '../data/triage.js';
import { tEs, niceDate, formatReason, langInfo } from '../i18n/index.js';
import { formatCard, formatDob } from '../data/patients.js';
import { Button, PriorityBadge } from '../components/ui.jsx';

const ORDER = { URGENTE: 0, PREFERENTE: 1, ORDINARIA: 2 };
const STATUS = {
  PENDIENTE_CITA: 'Pendiente de cita',
  CITADA: 'Citada',
  EN_REVISION: 'Llamar al paciente',
  DERIVADO_URGENCIAS: 'Enviado a 112 / Urgencias',
};

// Pacientes de ejemplo para la demo del panel
const DEMO = [
  { card: 'MDRZ810412345678', name: 'Carmen Ruiz Pérez', age: '81', area: 'CAR', symptoms: ['palpitaciones', 'piernas_hinchadas'], text: 'Noto el corazón como si saltara, sobre todo por las noches, y me ahogo un poco al subir la cuesta.', duration: 'semanas', evolution: 'peor', intensity: 2, followUp: 'no', access: ['ACOMPANANTE'], contacts: ['LLAMADA', 'CARTA'], address: 'C/ Mayor 12, 2º B, 28013 Madrid' },
  { card: 'CTOR450987654321', name: 'Javier Ortiz', age: '45', area: 'TRA', symptoms: ['dolor_espalda'], text: 'Dolor lumbar al estar mucho rato sentado en el trabajo.', duration: 'meses', evolution: 'igual', intensity: 0, followUp: 'no', access: ['NINGUNA'], contacts: ['APP', 'EMAIL'], email: 'javier.ortiz@correo.es' },
  { card: 'ANJM670555123456', name: 'Rosa Jiménez', age: '67', area: 'DIG', symptoms: ['sangre_heces', 'perdida_peso'], text: 'He perdido unos 5 kilos sin hacer dieta y a veces veo sangre.', duration: 'meses', evolution: 'peor', intensity: 1, followUp: 'no', access: ['NINGUNA'], contacts: ['SMS'] },
  { card: 'MDBN520222333444', name: 'Ahmed Benali', age: '52', area: 'OFT', symptoms: ['vision_borrosa', 'revision_gafas'], text: '', duration: 'meses', evolution: 'igual', intensity: 0, followUp: 'si', access: ['INTERPRETE'], contacts: ['SMS'] },
  { card: 'GAFR340111222333', name: 'Lucía Fernández', age: '34', area: 'DER', symptoms: ['lunar_cambia'], text: 'Un lunar de la espalda se ha oscurecido y tiene bordes raros.', duration: 'semanas', evolution: 'peor', intensity: 0, followUp: 'no', access: ['NINGUNA'], contacts: ['EMAIL'], email: 'lucia.fdez@correo.es' },
  { card: 'PVGM760999888777', name: 'Manuel Gómez', age: '76', area: 'NRL', symptoms: ['olvidos', 'temblor'], text: 'Mi hija dice que se me olvidan las cosas y me tiembla la mano derecha.', duration: 'meses', evolution: 'peor', intensity: 0, followUp: 'no', access: ['AUDITIVA', 'ACOMPANANTE'], contacts: ['LLAMADA', 'CARTA'], address: 'C/ Mayor 12, 2º B, 28013 Madrid' },
];

export default function Staff({ go }) {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [open, setOpen] = useState(null);

  const list = useMemo(() => state.triages
    .filter((t) => filter === 'ALL' || t.result.specialty === filter)
    .sort((a, b) => (a.result.emergency ? -1 : 0) - (b.result.emergency ? -1 : 0) || ORDER[a.result.priority] - ORDER[b.result.priority] || b.result.score - a.result.score),
  [state.triages, filter]);

  const k = {
    total: state.triages.length,
    urg: state.triages.filter((t) => t.result.priority === 'URGENTE').length,
    call: state.triages.filter((t) => t.status === 'EN_REVISION' || t.status === 'PENDIENTE_CITA').length,
    booked: state.appointments.filter((a) => a.status !== 'ANULADA').length,
  };

  const seed = () => {
    DEMO.forEach((d, i) => {
      const a = { ...d, redFlags: [], noFlags: true, phone: d.contacts.some((c) => c === 'SMS' || c === 'LLAMADA') ? `600 000 00${i}` : '', docType: 'DNI', docNumber: '12345678Z' };
      const patient = { card: d.card, docType: 'DNI', docNumber: '12345678Z', name: d.name, age: d.age, contacts: d.contacts, phone: a.phone, email: d.email, address: d.address, access: d.access };
      dispatch({ type: 'ADD_TRIAGE', triage: { id: uid('TR'), createdAt: new Date(Date.now() - i * 3600e3).toISOString(), answers: a, patient, result: evaluateTriage(a, patient), status: i % 2 ? 'EN_REVISION' : 'PENDIENTE_CITA', demo: true } });
    });
  };

  return (
    <main className="screen staff" lang="es" dir="ltr">
      <div className="staff-head">
        <div>
          <p className="eyebrow">Vista para el personal del centro (demo)</p>
          <h1 tabIndex={-1}>Panel de triaje</h1>
        </div>
        <Button variant="ghost" icon="←" onClick={() => go('home')}>Vista paciente</Button>
      </div>

      <div className="kpis">
        <div className="kpi"><span>{k.total}</span>Solicitudes</div>
        <div className="kpi danger"><span>{k.urg}</span>Prioridad alta</div>
        <div className="kpi warn"><span>{k.call}</span>Sin cita / llamar</div>
        <div className="kpi ok"><span>{k.booked}</span>Citas activas</div>
      </div>

      <div className="filters" role="group" aria-label="Filtrar por especialidad">
        <button type="button" className={`chip ${filter === 'ALL' ? 'is-selected' : ''}`} aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          Todas<span className="chip-count">{k.total}</span>
        </button>
        {Object.values(SPECIALTIES).map((s) => (
          <button key={s.code} type="button" className={`chip ${filter === s.code ? 'is-selected' : ''}`} aria-pressed={filter === s.code} onClick={() => setFilter(s.code)}>
            {s.name}<span className="chip-count">{state.triages.filter((t) => t.result.specialty === s.code).length}</span>
          </button>
        ))}
      </div>

      {!list.length && (
        <section className="card empty">
          <p>Todavía no hay solicitudes. Rellene el formulario como paciente o cargue ejemplos.</p>
          <Button onClick={seed}>Cargar 6 pacientes de ejemplo</Button>
        </section>
      )}

      <div className="staff-list">
        {list.map((t) => {
          const r = t.result;
          const info = PRIORITY_INFO[r.priority];
          const appt = state.appointments.find((a) => a.id === t.apptId);
          const ans = t.answers;
          const isOpen = open === t.id;
          const spec = SPECIALTIES[r.specialty];
          const color = r.emergency ? 'var(--danger)' : info.color;
          const soft = r.emergency ? 'var(--danger-soft)' : info.soft;
          return (
            <article key={t.id} className={`card staff-card ${r.emergency ? 'is-emergency' : ''} ${isOpen ? 'is-open' : ''}`} style={{ '--prio': color, '--prio-soft': soft }}>
              <button type="button" className="staff-row" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                <span className="staff-score"><b>{r.score ?? '—'}</b>puntos</span>
                <div className="staff-who">
                  <strong>{t.patient.name}</strong>
                  <span className="muted">{t.patient.age} años · {new Date(t.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="staff-tags">
                  {r.emergency ? <span className="badge badge-danger">Señal de alarma</span> : <PriorityBadge priority={r.priority} tr={tEs} />}
                  <span className="staff-spec">
                    {spec ? <strong>{spec.name}</strong> : <strong className="is-warn">Asignar consulta</strong>} · {r.visitType === 'S' ? 'Sucesiva' : 'Primera'}
                  </span>
                </div>
                <div className={`staff-status ${appt ? 'is-booked' : t.status === 'EN_REVISION' ? 'is-call' : ''}`}>
                  {appt ? `Cita ${niceDate(appt.slot.date, 'es-ES')}, ${appt.slot.time}` : STATUS[t.status]}
                </div>
                <span className="staff-chevron" aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="staff-detail">
                  {ans.text && (
                    <blockquote className="staff-quote">
                      <p>«{ans.text}»</p>
                      {ans.lang && ans.lang !== 'es' && <footer>Relato original en {langInfo(ans.lang).name}</footer>}
                    </blockquote>
                  )}
                  <div className="staff-cols">
                    <section>
                      <h3>Clínico</h3>
                      <dl>
                        <dt>Zona</dt><dd>{AREAS.find((z) => z.id === ans.area)?.label || '—'}</dd>
                        <dt>Síntomas</dt><dd>{(SYMPTOMS[ans.area] || []).filter((s) => ans.symptoms?.includes(s.id)).map((s) => s.label).join(' · ') || '—'}</dd>
                        <dt>Duración</dt><dd>{DURATIONS.find((d) => d.id === ans.duration)?.label || '—'}</dd>
                        <dt>Evolución</dt><dd>{EVOLUTION.find((d) => d.id === ans.evolution)?.label || '—'}</dd>
                        <dt>Intensidad</dt><dd>{INTENSITY.find((d) => d.id === ans.intensity)?.label || '—'}</dd>
                        <dt>Alarma</dt><dd>{ans.redFlags?.length ? ans.redFlags.map((f) => RED_FLAGS.find((x) => x.id === f)?.label).join(' · ') : 'Ninguna'}</dd>
                      </dl>
                      <h3>Motivos de prioridad</h3>
                      <ul>{r.reasons.map((x, i) => <li key={i}>{formatReason(tEs, x)}</li>)}</ul>
                    </section>
                    <section>
                      <h3>Paciente</h3>
                      <dl>
                        <dt>Tarjeta (TSI)</dt><dd>{t.patient.card ? formatCard(t.patient.card) : '—'}</dd>
                        <dt>Documento</dt><dd>{ans.docNumber ? `${tEs(`doc.${ans.docType}`)} ${ans.docNumber}` : '—'}</dd>
                        <dt>Nacimiento</dt><dd>{ans.dob ? formatDob(ans.dob) : 'No indicada'}</dd>
                        <dt>Idioma</dt><dd>{ans.lang ? langInfo(ans.lang).name : 'Español'}</dd>
                        <dt>Necesidades</dt><dd>{(ans.access || []).map((x) => ACCESSIBILITY.find((y) => y.id === x)?.label).join(' · ') || '—'}</dd>
                        <dt>Avisos por</dt>
                        <dd>
                          <ul>
                            {(ans.contacts || (ans.contact ? [ans.contact] : [])).map((id) => {
                              const detail = { SMS: ans.phone, LLAMADA: ans.phone, EMAIL: ans.email, CARTA: ans.address }[id];
                              return <li key={id}>{CONTACT.find((c) => c.id === id)?.label}{detail ? `: ${detail}` : ''}</li>;
                            })}
                          </ul>
                        </dd>
                      </dl>
                    </section>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="staff-foot">
        {list.length > 0 && <Button variant="secondary" onClick={seed}>Añadir pacientes de ejemplo</Button>}
        <Button variant="ghost-danger" onClick={() => dispatch({ type: 'RESET' })}>Borrar todos los datos de la demo</Button>
      </div>
    </main>
  );
}
