import { useState } from 'react';
import { LANGUAGES, useI18n } from '../i18n/index.js';
import { Choice, Modal } from './ui.jsx';
import { IconGlobe } from './icons.jsx';

// Botón de idioma en la cabecera. Abre una lista grande con cada idioma escrito en su propia lengua.
export default function LanguagePicker() {
  const { t, lang, info, locale, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  // Nombre de cada idioma en el idioma actual, como ayuda (p. ej. «Română · rumano»)
  let names = null;
  try { names = new Intl.DisplayNames([locale], { type: 'language' }); } catch { /* navegador antiguo */ }

  return (
    <>
      <button type="button" className="lang-btn" onClick={() => setOpen(true)} aria-label={t('lang.button', { name: info.name })}>
        <IconGlobe size={22} />
        <span className="lang-name">{info.name}</span>
        <span className="lang-code" aria-hidden="true">{info.code.toUpperCase()}</span>
      </button>
      <Modal open={open} title={t('lang.title')} onClose={() => setOpen(false)}>
        <p className="muted">{t('lang.help')}</p>
        <div className="choices lang-list" role="radiogroup" aria-label={t('lang.title')}>
          {LANGUAGES.map((l) => {
            const local = names?.of(l.code);
            return (
              <span key={l.code} lang={l.code} dir={l.dir || 'ltr'}>
                <Choice
                  label={l.name}
                  hint={local && local.toLowerCase() !== l.name.toLowerCase() ? local : undefined}
                  selected={lang === l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                />
              </span>
            );
          })}
        </div>
        <p className="muted small">{t('lang.note')}</p>
      </Modal>
    </>
  );
}
