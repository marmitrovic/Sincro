import { useStore } from '../data/store.jsx';
import { CENTER, daysFromToday } from '../data/slots.js';
import { useI18n, niceDate, visitName } from '../i18n/index.js';
import { Listen } from '../components/ui.jsx';
import { IconAlert, IconBell, IconCalendar, IconCheck, IconChevron, IconPhone } from '../components/icons.jsx';

// Pantalla de inicio (diseño C): botón grande para pedir cita, tres accesos rápidos,
// un aviso destacado si hay novedades y «Así funciona» como línea de pasos.
export default function Home({ go }) {
  const { state } = useStore();
  const { t, locale } = useI18n();

  const next = state.appointments
    .filter((a) => a.status !== 'ANULADA' && daysFromToday(a.slot.date) >= 0)
    .sort((a, b) => (a.slot.date + a.slot.time).localeCompare(b.slot.date + b.slot.time))[0];
  const unread = state.notifications.filter((n) => !n.read).length;
  const offers = state.notifications.filter((n) => n.type === 'OFERTA_ADELANTO' && n.status === 'PENDIENTE').length;
  const phone = CENTER.phone.replace(/\s/g, '');

  const how = [
    [t('home.how1b'), t('home.how1')],
    [t('home.how2b'), t('home.how2')],
    [t('home.how3b'), t('home.how3')],
  ];

  return (
    <main className="screen home">
      <a className="urgent-strip rise" href="tel:112">
        <span className="urgent-q"><IconAlert size={22} /> {t('home.urgent')}</span>
        <strong className="urgent-call">{t('home.call112')} <IconChevron size={20} className="arrow" /></strong>
      </a>

      <div className="home-hello rise">
        <h1 tabIndex={-1} className="home-title">{t('home.hello')}</h1>
        <p className="lead muted">{t('home.what')}</p>
      </div>

      <button type="button" className="btn btn-primary btn-cta rise" onClick={() => go('triage')}>
        <span>{t('home.book')}</span>
      </button>

      <div className="quick rise">
        <button type="button" className="quick-tile" onClick={() => go('appts')}>
          <span className="theme-icon ti-blue"><IconCalendar size={26} /></span>
          <span className="quick-label">{t('home.appts')}</span>
          {offers > 0 && <span className="quick-badge ok" aria-label={t('home.offer')}>!</span>}
        </button>
        <button type="button" className="quick-tile" onClick={() => go('notifs')}
          aria-label={unread ? `${t('home.notifs')}: ${t('home.notifsNew', { count: unread })}` : undefined}>
          <span className="theme-icon ti-orange"><IconBell size={26} /></span>
          <span className="quick-label">{t('home.notifs')}</span>
          {unread > 0 && <span className="quick-badge" aria-hidden="true">{unread}</span>}
        </button>
        <a className="quick-tile" href={`tel:${phone}`} aria-label={`${t('home.person')}. ${t('home.personSub', { phone: CENTER.phone })}`}>
          <span className="theme-icon ti-teal"><IconPhone size={26} /></span>
          <span className="quick-label">{t('home.callShort')}</span>
        </a>
      </div>

      {/* Aviso destacado: primero un adelanto disponible; si no, la próxima cita */}
      {offers > 0 ? (
        <div className="notice rise" role="status">
          <span className="notice-icon ok"><IconCheck size={20} /></span>
          <div className="notice-body">
            <div className="notice-title">{t('home.offerTitle')}</div>
            <div className="muted">{t('app.toastOffer')}</div>
            <button type="button" className="link notice-link" onClick={() => go('appts')}>{t('home.offerLink')}</button>
          </div>
        </div>
      ) : next ? (
        <div className="notice rise">
          <span className="notice-icon"><IconCalendar size={20} /></span>
          <div className="notice-body">
            <div className="notice-title">{t('home.appts')}</div>
            <div className="muted">{t('home.apptsNext', { date: niceDate(next.slot.date, locale), time: next.slot.time, spec: visitName(t) })}</div>
            <button type="button" className="link notice-link" onClick={() => go('appts')}>{t('home.apptsSub')}</button>
          </div>
        </div>
      ) : null}

      <section className="how rise">
        <h2>{t('home.how')}</h2>
        <ol className="timeline">
          {how.map(([b, rest], i) => (
            <li key={b} className={i === 0 ? 'is-active' : ''}>
              <span className="tl-dot" aria-hidden="true">{i + 1}</span>
              <div className="tl-text"><strong>{b}</strong> <span className="muted">{rest}</span></div>
            </li>
          ))}
        </ol>
        <Listen text={`${t('home.how')}. ${how.map(([b, rest], i) => `${i + 1}: ${b} ${rest}`).join(' ')}`} />
      </section>
    </main>
  );
}
