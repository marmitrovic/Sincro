// Guardar la cita en calendarios y compartirla.
// Todo se genera en el navegador: no se envían datos a ningún servidor.
import { CENTER, pad } from './slots.js';
import { niceDate, floorText, visitName } from '../i18n/index.js';

const TZ = 'Europe/Madrid';
const DURATION_MIN = 20;

// Fecha y hora de inicio y fin en formato compacto: 20261103T090000
function times(slot) {
  const [y, m, d] = slot.date.split('-');
  const [hh, mm] = slot.time.split(':').map(Number);
  const end = hh * 60 + mm + DURATION_MIN;
  const startC = `${y}${m}${d}T${pad(hh)}${pad(mm)}00`;
  const endC = `${y}${m}${d}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`;
  return {
    startC, endC,
    startIso: `${slot.date}T${pad(hh)}:${pad(mm)}:00`,
    endIso: `${slot.date}T${pad(Math.floor(end / 60))}:${pad(end % 60)}:00`,
  };
}

/** Datos de la cita ya traducidos, listos para cualquier calendario. */
export function eventFor(appt, t, locale) {
  const s = appt.slot;
  const spec = visitName(t);
  const room = `${t('room', { room: s.room })}, ${floorText(t, s.floor).toLowerCase()}`;
  const title = t('cal.summary', { spec });
  const location = `${CENTER.name}, ${CENTER.address}`;
  const details = t('cal.desc', { doctor: s.doctor, room });
  // Mensaje para WhatsApp, correo, SMS o copiar
  const text = [
    title,
    `${niceDate(s.date, locale)} · ${t('time', { time: s.time })}`,
    `${s.doctor} · ${room}`,
    location,
    t('msg.tip'),
  ].join('\n');
  return { title, location, details, text, ...times(s) };
}

// Escapa comas, puntos y coma y saltos de línea (formato iCalendar)
const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// Las líneas de un .ics no deben pasar de 75 bytes: se parten y la continuación empieza con un espacio
function fold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 73 : 74)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

// Archivo .ics: Calendario de Apple, Outlook de escritorio, Thunderbird, etc.
export function icsFor(appt, ev, t) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CitaFacil//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appt.id}@citafacil`, `DTSTAMP:${stamp}`,
    `DTSTART:${ev.startC}`, `DTEND:${ev.endC}`,
    `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(ev.location)}`, `DESCRIPTION:${esc(ev.details)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t('cal.alarm'))}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t('cal.alarm'))}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n');
}

// Google Calendar (Android, Gmail y cualquier navegador)
export const googleUrl = (ev) => `https://calendar.google.com/calendar/render?${new URLSearchParams({
  action: 'TEMPLATE', text: ev.title, dates: `${ev.startC}/${ev.endC}`, ctz: TZ, details: ev.details, location: ev.location,
})}`;

// Outlook.com / Hotmail
export const outlookUrl = (ev) => `https://outlook.live.com/calendar/0/action/compose?${new URLSearchParams({
  path: '/calendar/action/compose', rru: 'addevent', subject: ev.title, startdt: ev.startIso, enddt: ev.endIso, body: ev.details, location: ev.location,
})}`;

// Texto del código QR: la cámara del iPhone y de Android lo reconoce como evento de calendario
export const qrText = (ev) => [
  'BEGIN:VEVENT', `SUMMARY:${ev.title}`, `DTSTART:${ev.startC}`, `DTEND:${ev.endC}`, `LOCATION:${ev.location}`, 'END:VEVENT',
].join('\n');

export const whatsappUrl = (ev) => `https://wa.me/?text=${encodeURIComponent(ev.text)}`;
export const mailUrl = (ev) => `mailto:?subject=${encodeURIComponent(ev.title)}&body=${encodeURIComponent(ev.text)}`;
// "sms:?&body=" funciona tanto en Android como en iPhone
export const smsUrl = (ev) => `sms:?&body=${encodeURIComponent(ev.text)}`;

/** Tipo de dispositivo, para recomendar la opción más sencilla. */
export function detectPlatform() {
  const ua = navigator.userAgent || '';
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'windows';
  return 'other';
}
export const isMobilePlatform = (p) => p === 'ios' || p === 'android';

/** Abre o descarga el archivo .ics. En iPhone se abre directamente para que ofrezca «Añadir al calendario». */
export function openIcs(ics, filename, platform) {
  if (platform === 'ios') {
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return;
  }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
