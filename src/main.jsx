import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonte embutida no app (funciona offline). Subconjunto latino cobre acentos do português.
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/outfit/latin-800.css';
import '@fontsource/outfit/latin-900.css';
import './index.css';
import App from './App.jsx';
import { langFromLocale, setLang } from './i18n';
import { bootPlatform } from './platform';

// Escolhe o idioma antes da primeira tela: o do jogador na CrazyGames ou, fora dela, o do
// navegador/aparelho (português → pt, qualquer outro → inglês). Espera o SDK no máximo 3 s.
const timeout = new Promise((resolve) => setTimeout(() => resolve({}), 3000));
Promise.race([bootPlatform(), timeout]).then(({ locale }) => {
  setLang(langFromLocale(locale || navigator.language));
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
