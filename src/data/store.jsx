import { createContext, useContext, useEffect, useReducer } from 'react';

// Estado global de la app, guardado en el navegador (localStorage).
// En un producto real esto iría a un servidor del hospital.

// v2: identificación por tarjeta sanitaria, idiomas y nuevas respuestas del triaje
const KEY = 'citafacil-v2';

const initial = {
  patient: null,          // { card, name, age, phone, contact, access }
  triages: [],            // solicitudes de triaje enviadas
  appointments: [],       // citas
  notifications: [],      // avisos al paciente
  settings: { fontScale: 1, lang: null }, // lang: null = el idioma del dispositivo
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const saved = JSON.parse(raw);
    return { ...initial, ...saved, settings: { ...initial.settings, ...saved.settings } };
  } catch {
    return initial;
  }
}

export const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const now = () => new Date().toISOString();

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PATIENT':
      return { ...state, patient: { ...state.patient, ...action.patient } };

    case 'ADD_TRIAGE':
      return { ...state, triages: [action.triage, ...state.triages] };

    case 'UPDATE_TRIAGE':
      return { ...state, triages: state.triages.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };

    case 'BOOK': {
      const appt = action.appt;
      return {
        ...state,
        appointments: [appt, ...state.appointments],
        triages: state.triages.map((t) => (t.id === appt.triageId ? { ...t, status: 'CITADA', apptId: appt.id } : t)),
        notifications: [
          {
            id: uid('N'), type: 'CONFIRMACION_CITA', apptId: appt.id, at: now(), read: false,
            text: 'Su cita ha quedado reservada.',
          },
          ...state.notifications,
        ],
      };
    }

    case 'CONFIRM_ATTENDANCE':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id
            ? { ...a, status: 'CONFIRMADA', history: [...a.history, { type: 'CONFIRMACION', at: now(), note: 'El paciente confirma que vendrá' }] }
            : a),
      };

    case 'RESCHEDULE':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id
            ? {
                ...a, slot: action.slot, status: 'CITADA',
                history: [...a.history, { type: 'REPROGRAMACION', at: now(), note: action.note || 'Cambio de fecha', from: a.slot, to: action.slot }],
              }
            : a),
        notifications: [
          { id: uid('N'), type: 'AVISO_CAMBIO_CITA', apptId: action.id, at: now(), read: false, text: 'Hemos cambiado la fecha de su cita.' },
          ...state.notifications.map((n) => (n.apptId === action.id && n.type === 'OFERTA_ADELANTO' && n.status === 'PENDIENTE' ? { ...n, status: action.fromOffer ? 'ACEPTA' : 'CADUCADA' } : n)),
        ],
      };

    case 'CANCEL':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id
            ? { ...a, status: 'ANULADA', history: [...a.history, { type: 'ANULACION', at: now(), note: action.reason }] }
            : a),
      };

    case 'ADD_NOTIFICATION':
      if (state.notifications.some((n) => n.type === action.n.type && n.apptId === action.n.apptId && n.status === 'PENDIENTE')) return state;
      return { ...state, notifications: [{ id: uid('N'), at: now(), read: false, ...action.n }, ...state.notifications] };

    case 'RESPOND_OFFER':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, status: action.status, read: true } : n)) };

    case 'READ_ALL':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case 'SET_LANG':
      return { ...state, settings: { ...state.settings, lang: action.lang } };

    case 'SET_FONT':
      return { ...state, settings: { ...state.settings, fontScale: action.scale } };

    case 'RESET':
      return { ...initial, settings: state.settings };

    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento: seguimos en memoria */ }
  }, [state]);
  useEffect(() => {
    document.documentElement.style.setProperty('--scale', state.settings.fontScale);
  }, [state.settings.fontScale]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
