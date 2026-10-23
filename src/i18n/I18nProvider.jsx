import { useEffect, useMemo } from 'react';
import { useStore } from '../data/store.jsx';
import { I18nContext, MESSAGES, detectLanguage, langInfo, makeT, setSpeechLang } from './index.js';

// Proveedor del idioma: el elegido por el paciente o, si no ha elegido, el de su dispositivo.

export default function I18nProvider({ children }) {
  const { state, dispatch } = useStore();
  const lang = MESSAGES[state.settings.lang] ? state.settings.lang : detectLanguage();
  const info = langInfo(lang);

  const value = useMemo(() => ({
    lang,
    info,
    locale: info.locale,
    dir: info.dir || 'ltr',
    chosen: Boolean(state.settings.lang),
    t: makeT(lang),
    setLang: (code) => dispatch({ type: 'SET_LANG', lang: code }),
  }), [lang, info, state.settings.lang, dispatch]);

  setSpeechLang(info.speech);
  useEffect(() => {
    const root = document.documentElement;
    root.lang = info.code;
    root.dir = info.dir || 'ltr';
    document.title = value.t('app.title');
  }, [info, value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

