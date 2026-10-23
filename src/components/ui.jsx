import { useEffect, useRef } from 'react';
import { speechLang, useI18n } from '../i18n/index.js';
import { PRIORITY_INFO } from '../data/triage.js';
import { IconVolume } from './icons.jsx';

/* ---------- Voz: leer en alto ---------- */

export function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang();
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch { /* el navegador no permite voz */ }
}

/* ---------- Componentes básicos ---------- */

export function Button({ children, variant = 'primary', size, icon, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} ${size === 'lg' ? 'btn-lg' : ''} ${className}`} {...rest}>
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Tarjeta grande seleccionable (radio o checkbox)
export function Choice({ selected, onClick, icon, label, hint, multi = false, danger = false }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      className={`choice ${selected ? 'is-selected' : ''} ${danger ? 'is-danger' : ''}`}
      onClick={onClick}
    >
      {icon && <span className="choice-icon" aria-hidden="true">{icon}</span>}
      <span className="choice-text">
        <span className="choice-label">{label}</span>
        {hint && <span className="choice-hint">{hint}</span>}
      </span>
      <span className={`choice-mark ${multi ? 'square' : ''}`} aria-hidden="true">{selected ? '✓' : ''}</span>
    </button>
  );
}

export function Progress({ step, total }) {
  const { t } = useI18n();
  const text = t('ui.step', { step, total });
  return (
    <div className="progress" aria-label={text}>
      <div className="progress-text">{text}</div>
      <div className="progress-bar"><div style={{ width: `${(step / total) * 100}%` }} /></div>
    </div>
  );
}

// Aviso encima de las opciones: si hay que elegir una o se pueden marcar varias
export function ChooseHint({ multi = false }) {
  const { t } = useI18n();
  return (
    <p className="choose-hint">
      <span className={`choose-mark ${multi ? 'square' : ''}`} aria-hidden="true" />
      {multi ? t('ui.pickMany') : t('ui.pickOne')}
    </p>
  );
}

// Botón "Escuchar": lee el texto en voz alta en el idioma elegido
export function Listen({ text }) {
  const { t } = useI18n();
  return (
    <button type="button" className="listen" onClick={() => speak(text)}>
      <IconVolume size={20} /> {t('ui.listen')}
    </button>
  );
}

// Pregunta con botón "Escuchar"
export function Question({ title, help, speakText }) {
  return (
    <div className="question">
      <h1 tabIndex={-1} className="q-title">{title}</h1>
      {help && <p className="q-help">{help}</p>}
      <Listen text={speakText || `${title}. ${help || ''}`} />
    </div>
  );
}

// Iconos dibujados (se ven igual en todos los móviles, a diferencia de los emojis)
const svg = { width: '1.1em', height: '1.1em', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const IconClose = () => <svg {...svg}><path d="M6 6l12 12M18 6L6 18" /></svg>;
// Calendario con una X: anular cita
export const IconCalendarX = () => (
  <svg {...svg}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9.5 13l5 5M14.5 13l-5 5" /></svg>
);

// Flecha que se da la vuelta en idiomas que se leen de derecha a izquierda
export const Arrow = ({ back }) => <span className="arrow" aria-hidden="true">{back ? '←' : '→'}</span>;

// Barra inferior fija con Atrás / Continuar.
// hint: qué falta para poder continuar (solo se muestra mientras «Continuar» está desactivado)
export function NavBar({ onBack, onNext, nextLabel, nextDisabled, backLabel, nextVariant = 'primary', hint }) {
  const { t } = useI18n();
  const back = backLabel || t('ui.back');
  return (
    <div className="navbar">
      {onNext && nextDisabled && hint && <p className="navbar-hint" role="status">{hint}</p>}
      <div className="navbar-inner">
        {onBack ? <Button variant="ghost" icon={<Arrow back />} className="btn-back" aria-label={back} onClick={onBack}>{back}</Button> : <span />}
        {onNext && (
          <Button variant={nextVariant} size="lg" onClick={onNext} disabled={nextDisabled}>
            {nextLabel || t('ui.next')} <Arrow />
          </Button>
        )}
      </div>
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && <button type="button" className="modal-close" onClick={onClose} aria-label={t('ui.close')}><IconClose /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast" role="status" onClick={onClose}>
      <span aria-hidden="true">🔔</span> {message}
    </div>
  );
}

// tr: traductor opcional (el panel del personal siempre usa español)
export function PriorityBadge({ priority, tr }) {
  const { t: tCtx } = useI18n();
  const t = tr || tCtx;
  const info = PRIORITY_INFO[priority];
  return (
    <span className="badge" style={{ background: info.soft, color: info.color, borderColor: info.color }}>
      {t(`prio.${priority}.label`)}
    </span>
  );
}
