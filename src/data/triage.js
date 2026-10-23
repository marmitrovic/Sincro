// Motor de triaje orientativo (reglas simples y transparentes).
// NO es un diagnóstico: solo ordena la prioridad de la cita y orienta la especialidad.
// Los códigos de especialidad y prioridad coinciden con el dataset
// (CAR, DER, DIG, NRL, OFT, TRA · URGENTE / PREFERENTE / ORDINARIA).

export const SPECIALTIES = {
  OFT: { code: 'OFT', name: 'Oftalmología', plain: 'Ojos y visión', icon: '👁️' },
  DER: { code: 'DER', name: 'Dermatología', plain: 'Piel, uñas y pelo', icon: '🖐️' },
  CAR: { code: 'CAR', name: 'Cardiología', plain: 'Corazón y tensión', icon: '❤️' },
  DIG: { code: 'DIG', name: 'Aparato digestivo', plain: 'Estómago e intestino', icon: '🍽️' },
  NRL: { code: 'NRL', name: 'Neurología', plain: 'Cabeza, nervios y memoria', icon: '🧠' },
  TRA: { code: 'TRA', name: 'Traumatología', plain: 'Huesos, músculos y articulaciones', icon: '🦴' },
};

// Zonas del cuerpo que ve el paciente (lenguaje sencillo)
export const AREAS = [
  { id: 'OFT', label: 'Ojos o vista', icon: '👁️' },
  { id: 'DER', label: 'Piel, uñas o pelo', icon: '🖐️' },
  { id: 'CAR', label: 'Corazón, pecho o tensión', icon: '❤️' },
  { id: 'DIG', label: 'Estómago o digestión', icon: '🍽️' },
  { id: 'NRL', label: 'Cabeza, mareos o memoria', icon: '🧠' },
  { id: 'TRA', label: 'Huesos, espalda o articulaciones', icon: '🦴' },
  { id: 'UNK', label: 'No lo sé / otra cosa', icon: '❓' },
];

// Síntomas por zona. weight: 0 normal · 1 a vigilar · 2 importante
export const SYMPTOMS = {
  OFT: [
    { id: 'vision_borrosa', label: 'Veo borroso', weight: 1 },
    { id: 'ojo_rojo', label: 'Ojo rojo o irritado', weight: 0 },
    { id: 'dolor_ojo', label: 'Dolor en el ojo', weight: 1 },
    { id: 'manchas', label: 'Veo manchas, moscas o destellos', weight: 2 },
    { id: 'lagrimeo', label: 'Lagrimeo o picor', weight: 0 },
    { id: 'revision_gafas', label: 'Necesito revisión de la vista', weight: 0 },
  ],
  DER: [
    { id: 'lunar_cambia', label: 'Un lunar ha cambiado de forma o color', weight: 2 },
    { id: 'herida_no_cura', label: 'Una herida que no se cura', weight: 2 },
    { id: 'picor', label: 'Picor en la piel', weight: 0 },
    { id: 'granos', label: 'Granos, manchas o eccema', weight: 0 },
    { id: 'caida_pelo', label: 'Caída del pelo', weight: 0 },
    { id: 'unas', label: 'Problemas en las uñas', weight: 0 },
  ],
  CAR: [
    { id: 'palpitaciones', label: 'Noto el corazón acelerado o irregular', weight: 2 },
    { id: 'tension_alta', label: 'Tensión alta', weight: 1 },
    { id: 'cansancio_esfuerzo', label: 'Me canso mucho al caminar o subir escaleras', weight: 1 },
    { id: 'piernas_hinchadas', label: 'Piernas o tobillos hinchados', weight: 1 },
    { id: 'molestia_pecho_esfuerzo', label: 'Molestia en el pecho al hacer esfuerzo', weight: 2 },
    { id: 'revision_corazon', label: 'Revisión de un problema que ya tengo', weight: 0 },
  ],
  DIG: [
    { id: 'dolor_barriga', label: 'Dolor de barriga', weight: 1 },
    { id: 'ardor', label: 'Ardor o acidez', weight: 0 },
    { id: 'diarrea_estrenimiento', label: 'Diarrea o estreñimiento', weight: 0 },
    { id: 'sangre_heces', label: 'Sangre en las heces', weight: 2 },
    { id: 'perdida_peso', label: 'He perdido peso sin querer', weight: 2 },
    { id: 'dificultad_tragar', label: 'Me cuesta tragar', weight: 2 },
  ],
  NRL: [
    { id: 'dolor_cabeza', label: 'Dolor de cabeza frecuente', weight: 1 },
    { id: 'mareos', label: 'Mareos o vértigo', weight: 1 },
    { id: 'olvidos', label: 'Olvidos o pérdida de memoria', weight: 1 },
    { id: 'hormigueo', label: 'Hormigueo o adormecimiento', weight: 1 },
    { id: 'temblor', label: 'Temblor', weight: 1 },
    { id: 'desmayo', label: 'Me he desmayado', weight: 2 },
  ],
  TRA: [
    { id: 'dolor_espalda', label: 'Dolor de espalda o cuello', weight: 0 },
    { id: 'dolor_rodilla', label: 'Dolor de rodilla o cadera', weight: 0 },
    { id: 'dolor_hombro', label: 'Dolor de hombro, codo o mano', weight: 0 },
    { id: 'caida_golpe', label: 'Me he caído o me he dado un golpe', weight: 1 },
    { id: 'no_puedo_apoyar', label: 'No puedo apoyar o mover bien', weight: 2 },
    { id: 'hinchazon', label: 'Hinchazón en una articulación', weight: 1 },
  ],
  UNK: [
    { id: 'cansancio', label: 'Cansancio general', weight: 0 },
    { id: 'fiebre', label: 'Fiebre que vuelve', weight: 1 },
    { id: 'dolor_general', label: 'Dolor que no sé localizar', weight: 1 },
    { id: 'otro', label: 'Otra cosa (la explico después)', weight: 0 },
  ],
};

// Estas tres preguntas se responden en una sola pantalla, con pocas opciones cada una.
export const DURATIONS = [
  { id: 'hoy', label: 'Hoy o ayer', score: 2 },
  { id: 'dias', label: 'Unos días', score: 1 },
  { id: 'semanas', label: 'Unas semanas', score: 1 },
  { id: 'meses', label: 'Meses o más', score: 0 },
];

export const EVOLUTION = [
  { id: 'peor', label: 'Va a peor', icon: '📈', score: 1 },
  { id: 'igual', label: 'Sigue igual', icon: '➖', score: 0 },
  { id: 'mejor', label: 'Va mejorando', icon: '📉', score: -1 },
];

export const INTENSITY = [
  { id: 0, label: 'Poco', face: '🙂', score: 0 },
  { id: 1, label: 'Bastante', face: '😕', score: 1 },
  { id: 2, label: 'Mucho', face: '😣', score: 2 },
  { id: 3, label: 'Insoportable', face: '😫', score: 3 },
];

// Señales de alarma: si marca alguna, NO se da cita: se le indica llamar al 112.
export const RED_FLAGS = [
  { id: 'pecho', label: 'Dolor fuerte en el pecho ahora mismo', icon: '💔' },
  { id: 'aire', label: 'Me falta el aire, no puedo respirar bien', icon: '🫁' },
  { id: 'ictus', label: 'Se me tuerce la boca, pierdo fuerza o me cuesta hablar', icon: '🗣️' },
  { id: 'vision_subita', label: 'He perdido la vista de repente', icon: '🌑' },
  { id: 'sangrado', label: 'Sangrado abundante que no para', icon: '🩸' },
  { id: 'confusion', label: 'Fiebre muy alta con confusión o mucho sueño', icon: '🌡️' },
];

export const ACCESSIBILITY = [
  { id: 'NINGUNA', label: 'No necesito nada especial', icon: '✅' },
  { id: 'MOVILIDAD_REDUCIDA', label: 'Silla de ruedas o movilidad reducida', icon: '♿' },
  { id: 'ACOMPANANTE', label: 'Vendré con un acompañante', icon: '🧑‍🤝‍🧑' },
  { id: 'INTERPRETE', label: 'Necesito intérprete de idioma', icon: '🌍' },
  { id: 'AUDITIVA', label: 'Discapacidad auditiva o pérdida de audición', icon: '🦻' },
  { id: 'VISUAL', label: 'Discapacidad visual o baja visión', icon: '🦯' },
];

export const CONTACT = [
  { id: 'SMS', label: 'Mensaje SMS', icon: '💬' },
  { id: 'LLAMADA', label: 'Llamada de teléfono', icon: '📞' },
  { id: 'EMAIL', label: 'Correo electrónico', icon: '✉️' },
  { id: 'APP', label: 'Aviso en esta web', icon: '🔔' },
  { id: 'CARTA', label: 'Carta a casa', icon: '📮' },
];

// Palabras del texto libre que suben la prioridad o sugieren especialidad
const KEYWORDS = {
  alarm: ['no puedo respirar', 'me ahogo', 'dolor en el pecho fuerte', 'desmay', 'convuls', 'sangra mucho', 'paralis'],
  important: ['sangre', 'perdido peso', 'adelgaz', 'bulto', 'empeora', 'cada vez peor', 'no duermo', 'no puedo caminar', 'no puedo andar', 'muy fuerte', 'insoportable'],
  OFT: ['ojo', 'vista', 'visión', 'vision', 'veo', 'gafas', 'párpado'],
  DER: ['piel', 'lunar', 'mancha', 'picor', 'pica', 'grano', 'uña', 'pelo', 'eccema'],
  CAR: ['corazón', 'corazon', 'tensión', 'tension', 'palpita', 'pecho', 'arritmia'],
  DIG: ['estómago', 'estomago', 'barriga', 'tripa', 'digest', 'diarrea', 'vómit', 'vomit', 'acidez', 'heces'],
  NRL: ['cabeza', 'mareo', 'vértigo', 'vertigo', 'memoria', 'olvid', 'hormigueo', 'temblor', 'migraña'],
  TRA: ['espalda', 'rodilla', 'cadera', 'hombro', 'hueso', 'músculo', 'musculo', 'tobillo', 'muñeca', 'caída', 'golpe', 'lumbar'],
};

const norm = (s = '') => s.toLowerCase();

export function guessAreaFromText(text) {
  const t = norm(text);
  let best = null, bestHits = 0;
  for (const code of Object.keys(SPECIALTIES)) {
    const hits = KEYWORDS[code].filter((k) => t.includes(k)).length;
    if (hits > bestHits) { best = code; bestHits = hits; }
  }
  return best;
}

export const MAX_WAIT_DAYS = { URGENTE: 3, PREFERENTE: 15, ORDINARIA: 60 };

export const PRIORITY_INFO = {
  URGENTE: {
    label: 'Prioridad alta',
    plain: 'Le daremos cita en los próximos días.',
    color: 'var(--danger)',
    soft: 'var(--danger-soft)',
  },
  PREFERENTE: {
    label: 'Prioridad media',
    plain: 'Le daremos cita en las próximas 2 semanas.',
    color: 'var(--warn)',
    soft: 'var(--warn-soft)',
  },
  ORDINARIA: {
    label: 'Prioridad normal',
    plain: 'Le daremos la primera cita libre. Si se libera un hueco antes, le avisaremos.',
    color: 'var(--ok)',
    soft: 'var(--ok-soft)',
  },
};

/**
 * Calcula el resultado del triaje.
 * Los motivos (reasons) se guardan como códigos para poder mostrarlos en cualquier idioma
 * (ver formatReason en src/i18n). La especialidad UNK significa que la decidirá un profesional.
 * @returns {{ emergency, priority, specialty, visitType, score, reasons[], maxWaitDays }}
 */
export function evaluateTriage(a, patient = {}) {
  const reasons = [];

  if (a.redFlags?.length) {
    return { emergency: true, priority: 'URGENTE', specialty: null, reasons: [{ code: 'redflag' }] };
  }

  // Especialidad: zona elegida o, si no lo sabe, la que sugiere el texto
  let specialty = a.area !== 'UNK' ? a.area : guessAreaFromText(a.text);
  if (!specialty) specialty = 'UNK';

  let score = 0;
  const list = SYMPTOMS[a.area] || [];
  const chosen = list.filter((s) => a.symptoms?.includes(s.id));
  const important = chosen.filter((s) => s.weight === 2);
  const watch = chosen.filter((s) => s.weight === 1);
  if (important.length) {
    score += 3 + (important.length - 1);
    reasons.push({ code: 'important', items: important.map((s) => s.id) });
  }
  if (watch.length) score += Math.min(watch.length, 2);

  const intensity = INTENSITY.find((i) => i.id === a.intensity);
  if (intensity) {
    score += intensity.score;
    if (intensity.score >= 2) reasons.push({ code: intensity.score >= 3 ? 'int3' : 'int2' });
  }

  const duration = DURATIONS.find((d) => d.id === a.duration);
  if (duration) score += duration.score;

  const evo = EVOLUTION.find((e) => e.id === a.evolution);
  if (evo) {
    score += evo.score;
    if (evo.id === 'peor') reasons.push({ code: 'worse' });
  }

  const t = norm(a.text);
  if (KEYWORDS.alarm.some((k) => t.includes(k))) {
    score += 4;
    reasons.push({ code: 'keywords' });
  } else if (KEYWORDS.important.some((k) => t.includes(k))) {
    score += 1;
  }

  const age = Number(patient.age);
  if (age >= 75) { score += 1; reasons.push({ code: 'age' }); }

  let priority = 'ORDINARIA';
  if (score >= 7) priority = 'URGENTE';
  else if (score >= 4) priority = 'PREFERENTE';

  if (!reasons.length) reasons.push({ code: 'none' });

  return {
    emergency: false,
    priority,
    specialty,
    visitType: a.followUp === 'si' ? 'S' : 'P', // S = sucesiva (revisión), P = primera
    score,
    reasons,
    maxWaitDays: MAX_WAIT_DAYS[priority],
  };
}
