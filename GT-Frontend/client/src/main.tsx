import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import AuthProvider from './context/AuthProvider';
import { CurrencyProvider } from './context/CurrencyProvider';

import './index.css';
import './i18n';

import App from './App';

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  </StrictMode>,
);