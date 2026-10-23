// Identificación por tarjeta sanitaria (simulada).
// En un producto real, el código de la tarjeta se consultaría en el registro de pacientes
// (tabla PACIENTES / tarjeta sanitaria individual). Aquí se generan unos datos de ejemplo
// a partir del código, siempre los mismos para el mismo código.

const FIRST = ['María', 'Carmen', 'José', 'Antonio', 'Ana', 'Manuel', 'Lucía', 'Francisco', 'Isabel', 'David', 'Laura', 'Javier', 'Pilar', 'Juan', 'Rosa', 'Miguel', 'Fátima', 'Ahmed', 'Elena', 'Ion'];
const LAST = ['García', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Navarro', 'Torres'];

// Deja solo letras y números, en mayúsculas
export const normalizeCard = (s = '') => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

// Los códigos cambian según la comunidad autónoma: aceptamos de 8 a 20 letras o números, con algún número.
export const isValidCard = (s) => /^[A-Z0-9]{8,20}$/.test(normalizeCard(s)) && /\d/.test(s);

// Muestra el código en grupos de 4 para leerlo mejor: BBBB 1234 5678 9012
export const formatCard = (s) => normalizeCard(s).replace(/(.{4})(?=.)/g, '$1 ');

// Oculta parte del código en pantallas que puede ver otra persona
export const maskCard = (s) => {
  const c = normalizeCard(s);
  return c.length > 4 ? `•••• ${c.slice(-4)}` : c;
};

/* ---------- Documento de identidad: DNI, NIE o pasaporte ---------- */

export const DOC_TYPES = ['DNI', 'NIE', 'PAS'];
// Caracteres que hay que escribir en cada documento (sin espacios ni guiones)
export const DOC_MAX = { DNI: 9, NIE: 9, PAS: 9 };
export const CARD_MAX = 20;
const LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
export const normalizeDoc = (s = '') => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Comprueba el formato y, en DNI y NIE, que la letra corresponde a los números. */
export function isValidDoc(type, value) {
  const v = normalizeDoc(value);
  if (type === 'DNI') return /^\d{8}[A-Z]$/.test(v) && LETTERS[Number(v.slice(0, 8)) % 23] === v[8];
  if (type === 'NIE') {
    if (!/^[XYZ]\d{7}[A-Z]$/.test(v)) return false;
    const n = Number(`${'XYZ'.indexOf(v[0])}${v.slice(1, 8)}`);
    return LETTERS[n % 23] === v[8];
  }
  if (type === 'PAS') return /^[A-Z0-9]{6,9}$/.test(v) && /\d/.test(v);
  return false;
}

// Oculta el documento salvo los 4 últimos caracteres: •••• 678Z
export const maskDoc = (s) => `•••• ${normalizeDoc(s).slice(-4)}`;

/* ---------- Fecha de nacimiento (opcional) ---------- */

/** Devuelve la fecha como 'AAAA-MM-DD' si es una fecha real y pasada, o null. */
export function parseDob(day, month, year) {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!/^\d{4}$/.test(String(year).trim()) || !d || !m) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  if (y < 1900 || date > new Date()) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function ageFromDob(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return String(age);
}

// 'AAAA-MM-DD' → 'DD/MM/AAAA'
export const formatDob = (iso = '') => iso.split('-').reverse().join('/');

/* ---------- Datos de contacto ---------- */

export const isValidPhone = (s = '') => s.replace(/\D/g, '').length >= 9;
export const isValidEmail = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
// Para enviar una carta hace falta la dirección con el código postal (5 cifras)
export const isValidAddress = (s = '') => s.trim().length >= 10 && /\b\d{5}\b/.test(s);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Devuelve { card, name, age } o null si el código no es válido. */
export function lookupPatient(card) {
  if (!isValidCard(card)) return null;
  const c = normalizeCard(card);
  const h = hash(c);
  return {
    card: c,
    name: `${FIRST[h % FIRST.length]} ${LAST[(h >>> 8) % LAST.length]} ${LAST[(h >>> 16) % LAST.length]}`,
    age: String(18 + ((h >>> 4) % 75)),
  };
}

// Nombre corto para mostrar al paciente: «María L.»
export const shortName = (name = '') => {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
};
