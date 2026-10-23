import { useCallback, useEffect, useState } from 'react';
import { useStore } from './data/store.jsx';
import { findEarlierSlot, daysFromToday } from './data/slots.js';
import { Toast } from './components/ui.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import { LogoMark } from './components/Logo.jsx';
import { IconBell } from './components/icons.jsx';
import { useI18n } from './i18n/index.js';
import Home from './screens/Home.jsx';
import Triage from './screens/Triage.jsx';
import { Result, Emergency, Callback } from './screens/Result.jsx';
import PickSlot from './screens/PickSlot.jsx';
import { Booked, MyAppointments, Notifications } from './screens/Appointments.jsx';
import Staff from './screens/Staff.jsx';

const SCREENS = {
  home: Home, triage: Triage, result: Result, emergency: Emergency, callback: Callback,
  pick: PickSlot, booked: Booked, appts: MyAppointments, notifs: Notifications, staff: Staff,
};

export default function App() {
  const { state, dispatch } = useStore();
  const { t } = useI18n();
  const [route, setRoute] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return { name: h === 'staff' ? 'staff' : 'home', params: {} };
  });
  const [toast, setToast] = useState('');

  // Navegación con soporte para el botón "atrás" del navegador / móvil
  const go = useCallback((name, params = {}) => {
    window.history.pushState({ name, params }, '', name === 'staff' ? '#staff' : '#');
    setRoute({ name, params });
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    window.history.replaceState(route, '');
    const onPop = (e) => setRoute(e.state?.name ? e.state : { name: 'home', params: {} });
    const onHash = () => { if (window.location.hash === '#staff') setRoute({ name: 'staff', params: {} }); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onHash); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (route.name === 'notifs') dispatch({ type: 'READ_ALL' });
  }, [route.name, dispatch]);

  // Simulación: pocos segundos después de reservar una cita lejana, se libera un hueco antes
  const latest = state.appointments[0];
  useEffect(() => {
    if (!latest || latest.status === 'ANULADA' || latest.offerChecked) return;
    if (state.notifications.some((n) => n.type === 'OFERTA_ADELANTO' && n.apptId === latest.id)) return;
    if (daysFromToday(latest.slot.date) <= 7) return;
    const t = setTimeout(() => {
      const taken = state.appointments.map((a) => a.slot.id);
      const slot = findEarlierSlot(latest, taken);
      if (!slot) return;
      dispatch({ type: 'ADD_NOTIFICATION', n: { type: 'OFERTA_ADELANTO', apptId: latest.id, slot, status: 'PENDIENTE' } });
      setToast('app.toastOffer');
    }, 9000);
    return () => clearTimeout(t);
  }, [latest, state.appointments, state.notifications, dispatch]);

  // Recordatorio automático para citas en los próximos 2 días
  useEffect(() => {
    state.appointments
      .filter((a) => a.status !== 'ANULADA' && daysFromToday(a.slot.date) >= 0 && daysFromToday(a.slot.date) <= 2)
      .forEach((a) => {
        if (!state.notifications.some((n) => n.type === 'RECORDATORIO' && n.apptId === a.id)) {
          dispatch({ type: 'ADD_NOTIFICATION', n: { type: 'RECORDATORIO', apptId: a.id, status: 'ENVIADO' } });
        }
      });
  }, [state.appointments, state.notifications, dispatch]);

  const closeToast = useCallback(() => setToast(''), []);
  const Screen = SCREENS[route.name] || Home;
  const unread = state.notifications.filter((n) => !n.read).length;
  const scale = state.settings.fontScale;

  return (
    <div className="app">
      <a href="#main" className="skip">{t('app.skip')}</a>
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => go('home')} aria-label={t('app.home')}>
            <LogoMark size={44} />
            <span className="brand-text">
              <span className="brand-name">Sincro</span>
            </span>
          </button>
          <div className="topbar-actions">
            {route.name !== 'staff' && <LanguagePicker />}
            {/* Tamaño de letra como control segmentado: A · A+ · A++ */}
            <div className="font-size" role="radiogroup" aria-label={t('app.fontGroup')}>
              {[1, 1.15, 1.3].map((s, i) => (
                <button key={s} type="button" role="radio" aria-checked={scale === s} className={scale === s ? 'is-on' : ''}
                  onClick={() => dispatch({ type: 'SET_FONT', scale: s })} aria-label={t(`app.font${i + 1}`)}>
                  {['A', 'A+', 'A++'][i]}
                </button>
              ))}
            </div>
            {route.name !== 'staff' && (
              <button type="button" className="bell" onClick={() => go('notifs')} aria-label={unread ? t('app.notifsNew', { n: unread }) : t('app.notifs')}>
                <IconBell size={22} />{unread > 0 && <span className="bell-count">{unread}</span>}
              </button>
            )}
          </div>
        </div>
      </header>

      <div id="main" className="content">
        <Screen key={route.name + JSON.stringify(route.params)} go={go} params={route.params} />
      </div>

      {!['triage'].includes(route.name) && (
        <footer className="footer">
          <p>{t('app.footer')}</p>
          {route.name !== 'staff' && <button type="button" className="link" onClick={() => go('staff')}>{t('app.staff')}</button>}
        </footer>
      )}

      <Toast message={toast && t(toast)} onClose={closeToast} />
    </div>
  );
}
