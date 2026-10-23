import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { useI18n } from '../i18n/index.js';
import {
  eventFor, icsFor, googleUrl, outlookUrl, qrText, whatsappUrl, mailUrl, smsUrl, detectPlatform, isMobilePlatform, openIcs,
} from '../data/calendar.js';
import { Arrow } from './ui.jsx';

// Los textos del QR pueden llevar tildes y otros alfabetos
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

// Código QR dibujado en SVG (siempre negro sobre blanco para que la cámara lo lea bien)
export function QrCode({ text, label, size = 220 }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d: path, n: count + 8 };
  }, [text]);
  return (
    <svg className="qr" role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

function Option({ o, recommended, recLabel }) {
  const inner = (
    <>
      <span className="save-icon" aria-hidden="true">{o.icon}</span>
      <span className="save-text">
        <span className="save-label">{o.label}</span>
        {o.hint && <span className="save-hint">{o.hint}</span>}
        {recommended && <span className="save-rec">★ {recLabel}</span>}
      </span>
      <span className="save-arrow"><Arrow /></span>
    </>
  );
  const cls = `save-opt ${recommended ? 'is-rec' : ''}`;
  if (o.href) {
    const external = o.href.startsWith('http');
    return <a className={cls} href={o.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{inner}</a>;
  }
  return <button type="button" className={cls} onClick={o.onClick}>{inner}</button>;
}

/**
 * Todas las formas de guardar la cita: calendarios (Google, Apple, Outlook, .ics),
 * pasarla del ordenador al móvil con un QR, enviarla (WhatsApp, correo, SMS, compartir, copiar) o imprimirla.
 * La primera opción es la más sencilla para el dispositivo del paciente.
 */
export default function SaveOptions({ appt, onPrint }) {
  const { t, locale } = useI18n();
  const platform = useMemo(() => detectPlatform(), []);
  const mobile = isMobilePlatform(platform);
  const [copied, setCopied] = useState(false);

  const ev = eventFor(appt, t, locale);
  const ics = icsFor(appt, ev, t);
  const file = `cita-${appt.slot.date}.ics`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const opts = {
    google: { icon: '📅', label: t('save.google'), hint: t('save.googleHint'), href: googleUrl(ev) },
    apple: { icon: '🍎', label: t('save.apple'), hint: t('save.appleHint'), onClick: () => openIcs(ics, file, platform) },
    outlook: { icon: '📨', label: t('save.outlook'), hint: t('save.outlookHint'), href: outlookUrl(ev) },
    ics: { icon: '🗂️', label: t('save.ics'), hint: t('save.icsHint'), onClick: () => openIcs(ics, file, platform) },
  };
  const order = {
    ios: ['apple', 'google', 'outlook'],          // en iPhone, «Apple» y «.ics» son lo mismo
    mac: ['apple', 'google', 'outlook', 'ics'],
    android: ['google', 'outlook', 'apple', 'ics'],
    windows: ['google', 'outlook', 'apple', 'ics'],
    other: ['google', 'outlook', 'apple', 'ics'],
  }[platform];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ev.text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = ev.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  };
  const share = async () => {
    try { await navigator.share({ title: ev.title, text: ev.text }); } catch { /* el paciente lo ha cancelado */ }
  };

  const send = [
    canShare && mobile && { id: 'share', icon: '📤', label: t('save.share'), onClick: share },
    { id: 'wa', icon: '💬', label: t('save.whatsapp'), href: whatsappUrl(ev) },
    { id: 'mail', icon: '✉️', label: t('save.email'), href: mailUrl(ev) },
    mobile && { id: 'sms', icon: '📱', label: t('save.sms'), href: smsUrl(ev) },
    canShare && !mobile && { id: 'share', icon: '📤', label: t('save.share'), onClick: share },
    { id: 'copy', icon: '📋', label: t('save.copy'), onClick: copy },
  ].filter(Boolean);

  return (
    <div className="save">
      <p className="muted">{t('save.help')}</p>

      <h3 className="save-h"><span aria-hidden="true">🗓️</span> {t('save.cal')}</h3>
      <div className="save-list">
        {order.map((id, k) => <Option key={id} o={opts[id]} recommended={k === 0} recLabel={t('save.recommended')} />)}
      </div>

      {!mobile && (
        <>
          <h3 className="save-h"><span aria-hidden="true">📲</span> {t('save.phone')}</h3>
          <div className="qr-box">
            <QrCode text={qrText(ev)} label={t('save.qrAlt')} />
            <p>{t('save.qrHelp')}</p>
          </div>
        </>
      )}

      <h3 className="save-h"><span aria-hidden="true">👪</span> {t('save.send')}</h3>
      <p className="muted small">{t('save.sendHelp')}</p>
      <div className="save-list">
        {send.map((o) => <Option key={o.id} o={o} />)}
      </div>
      <p className="copied" role="status">{copied ? `✓ ${t('save.copied')}` : ''}</p>

      <h3 className="save-h"><span aria-hidden="true">📄</span> {t('save.paper')}</h3>
      <div className="save-list">
        <Option o={{ icon: '🖨️', label: t('save.print'), onClick: onPrint || (() => window.print()) }} />
      </div>
    </div>
  );
}
