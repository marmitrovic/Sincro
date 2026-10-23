import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './data/store.jsx';
import I18nProvider from './i18n/I18nProvider.jsx';
import App from './App.jsx';
// Source Sans 3: letra humanista muy usada en webs sanitarias públicas (CDC, Medicare.gov); incluye cirílico
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StoreProvider>
  </StrictMode>,
);
