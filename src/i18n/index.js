import { createContext, useContext } from 'react';
import es from './locales/es.js';
import ca from './locales/ca.js';
import eu from './locales/eu.js';
import gl from './locales/gl.js';
import en from './locales/en.js';
import fr from './locales/fr.js';
import pt from './locales/pt.js';
import ro from './locales/ro.js';
import uk from './locales/uk.js';
import ar from './locales/ar.js';

// Idiomas disponibles. Para añadir uno: crear src/i18n/locales/xx.js (copiando en.js) y sumarlo aquí.
// locale: formato de fechas · speech: voz para «Escuchar» y el dictado · dir: sentido de lectura
export const LANGUAGES = [
  { code: 'es', name: 'Español', locale: 'es-ES', speech: 'es-ES' },
  { code: 'ca', name: 'Català', locale: 'ca-ES', speech: 'ca-ES' },
  { code: 'eu', name: 'Euskara', locale: 'eu-ES', speech: 'eu-ES' },
  { code: 'gl', name: 'Galego', locale: 'gl-ES', speech: 'gl-ES' },
  { code: 'en', name: 'English', locale: 'en-GB', speech: 'en-GB' },
  { code: 'fr', name: 'Français', locale: 'fr-FR', speech: 'fr-FR' },
  { code: 'pt', name: 'Português', locale: 'pt-PT', speech: 'pt-PT' },
  { code: 'ro', name: 'Română', locale: 'ro-RO', speech: 'ro-RO' },
  { code: 'uk', name: 'Українська', locale: 'uk-UA', speech: 'uk-UA' },
  { code: 'ar', name: 'العربية', locale: 'ar-u-nu-latn', speech: 'ar-SA', dir: 'rtl' },
];

export const MESSAGES = { es, ca, eu, gl, en, fr, pt, ro, uk, ar };
export const langInfo = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];

/**
 * Idioma por defecto: el que tiene configurado el dispositivo desde el que entra el paciente
 * (navigator.languages refleja el idioma y la región del móvil u ordenador).
 * No pide permisos ni envía datos fuera. Si no lo tenemos, español.
 */
export function detectLanguage() {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of list) {
      const l = String(tag || '').toLowerCase();
      if (l.includes('valencia') || l.startsWith('va')) return 'ca';
      const primary = l.split('-')[0];
      if (MESSAGES[primary]) return primary;
    }
  } catch { /* sin navegador */ }
  return 'es';
}

/** Crea la función de traducir t(clave, variables) para un idioma. Si falta una frase, usa el español. */
export function makeT(lang) {
  const dict = MESSAGES[lang] || es;
  let plural;
  try { plural = new Intl.PluralRules(langInfo(lang).locale); } catch { plural = new Intl.PluralRules('es'); }
  const esPlural = new Intl.PluralRules('es');

  return (key, vars) => {
    let s;
    if (vars && typeof vars.count === 'number') {
      s = dict[`${key}.${plural.select(vars.count)}`] ?? dict[`${key}.other`]
        ?? es[`${key}.${esPlural.select(vars.count)}`] ?? es[`${key}.other`];
    }
    s = s ?? dict[key] ?? es[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m));
    return s;
  };
}

// Traductor en español, para el panel del personal y los datos que lee el médico
export const tEs = makeT('es');

// Idioma de la voz para speak() y el dictado (lo actualiza I18nProvider)
let currentSpeech = 'es-ES';
export const setSpeechLang = (l) => { currentSpeech = l; };
export const speechLang = () => currentSpeech;

export const I18nContext = createContext(null);

export const useI18n = () => useContext(I18nContext);

/* ---------- Ayudas para textos que dependen de los datos ---------- */

// Etiqueta traducida de un elemento de datos (zona, síntoma, duración…)
export const label = (t, prefix, item) => (item ? t(`${prefix}.${item.id ?? item.code}`) : '');

export const specName = (t, code) => t(`spec.${code}.name`);
export const specPlain = (t, code) => t(`spec.${code}.plain`);
// Lo que ve el paciente: siempre medicina general (el médico de familia le deriva después si hace falta)
export const visitName = (t) => t('visit.general');

export const floorText = (t, floor) => (floor === 0 ? t('floor.ground') : t('floor.n', { n: floor }));

// Motivo de prioridad. Admite también motivos antiguos guardados como texto.
export function formatReason(t, r) {
  if (typeof r === 'string') return r;
  if (r.code === 'important') {
    return t('reason.important', { items: r.items.map((id) => t(`sym.${id}`).toLowerCase()).join(', ') });
  }
  return t(`reason.${r.code}`);
}

/* ---------- Fechas ---------- */

const fmtCache = new Map();
function fmt(locale, opts) {
  const k = locale + JSON.stringify(opts);
  if (!fmtCache.has(k)) {
    try { fmtCache.set(k, new Intl.DateTimeFormat(locale, opts)); } catch { fmtCache.set(k, new Intl.DateTimeFormat('es-ES', opts)); }
  }
  return fmtCache.get(k);
}
const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const niceDate = (iso, locale) => cap(fmt(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(iso)));
export const shortDate = (iso, locale) => fmt(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(toDate(iso));
export const dateTime = (isoDateTime, locale) => fmt(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoDateTime));

export function relativeDay(t, n) {
  if (n === 0) return t('rel.today');
  if (n === 1) return t('rel.tomorrow');
  if (n < 0) return t('rel.ago', { count: -n });
  return t('rel.in', { count: n });
}
