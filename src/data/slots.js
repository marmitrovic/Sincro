// Generador de huecos de agenda de demostración.
// Imita la estructura de AGENDAS / HUECOS_AGENDA: consultas de 08:00 a 15:00, citas de 20 minutos.

const DOCTORS = {
  OFT: ['Dra. Lucía Martín', 'Dr. Andrés Gil', 'Dra. Paula Ríos'],
  DER: ['Dra. Elena Sanz', 'Dr. Javier Mora'],
  CAR: ['Dr. Manuel Ortega', 'Dra. Carmen Vidal'],
  DIG: ['Dra. Sara Núñez', 'Dr. Pablo Herrera'],
  NRL: ['Dr. Luis Prieto', 'Dra. Ana Campos'],
  TRA: ['Dr. Raúl Medina', 'Dra. Inés Castro', 'Dr. Óscar León'],
};

export const CENTER = {
  name: 'Hospital Universitario (Consultas Externas)',
  address: 'Avenida de la Salud, 10 · Edificio B',
  phone: '900 000 000',
};

const ROOMS = { OFT: 'B-12', DER: 'B-05', CAR: 'B-21', DIG: 'B-17', NRL: 'B-08', TRA: 'B-02' };
const FLOOR = { OFT: 1, DER: 0, CAR: 2, DIG: 1, NRL: 0, TRA: 0 };

// Pseudo-aleatorio determinista (siempre el mismo resultado para la misma fecha y hueco)
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

export const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const TIMES = [];
for (let m = 8 * 60; m < 15 * 60; m += 20) TIMES.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);

/**
 * Devuelve los huecos libres de una especialidad, agrupados por día.
 * minDay / maxDay: días desde hoy. Ordinaria empieza más tarde para simular lista de espera real.
 */
export function getFreeSlots(specialty, { minDay = 1, maxDay = 30, takenIds = [], maxDays = 6 } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let offset = minDay; offset <= maxDay && days.length < maxDays; offset++) {
    const d = addDays(today, offset);
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue; // sin consultas el fin de semana
    const date = isoDate(d);
    const docs = DOCTORS[specialty] || DOCTORS.TRA;
    const slots = [];
    docs.forEach((doctor, di) => {
      TIMES.forEach((time) => {
        const id = `H-${specialty}-${date}-${di}-${time}`;
        // ~85% ocupados: así parece una agenda real
        if (seeded(id) < 0.86 || takenIds.includes(id)) return;
        slots.push({
          id, date, time, doctor, specialty,
          room: ROOMS[specialty] || 'B-01',
          floor: FLOOR[specialty] ?? 0,
          agenda: `AG-${specialty}-${di + 1}`,
        });
      });
    });
    slots.sort((a, b) => a.time.localeCompare(b.time));
    // Una sola opción por hora: más fácil de elegir para el paciente
    const unique = slots.filter((s, i) => i === 0 || s.time !== slots[i - 1].time);
    if (unique.length) days.push({ date, slots: unique });
  }
  return days;
}

export function windowForPriority(priority) {
  if (priority === 'URGENTE') return { minDay: 1, maxDay: 4 };
  if (priority === 'PREFERENTE') return { minDay: 3, maxDay: 15 };
  return { minDay: 18, maxDay: 60 };
}

// Hueco "liberado" que se ofrece como adelanto (simula OFERTA_ADELANTO del dataset)
export function findEarlierSlot(appt, takenIds = []) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const current = new Date(appt.slot.date);
  const daysUntil = Math.round((current - now) / 86400000);
  if (daysUntil <= 3) return null;
  const days = getFreeSlots(appt.specialty, { minDay: 2, maxDay: Math.max(2, daysUntil - 3), takenIds, maxDays: 1 });
  return days[0]?.slots[Math.floor(days[0].slots.length / 2)] || null;
}

// Días que faltan desde hoy (negativo si ya pasó). Los textos de fechas están en src/i18n.
export function daysFromToday(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - now) / 86400000);
}
