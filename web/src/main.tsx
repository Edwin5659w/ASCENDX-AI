import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { BrandSplash } from './components/brand/BrandSplash';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initSentry } from './lib/sentry';
import { loadAnalyticsScripts } from './lib/analytics';
import './index.css';

initSentry();
loadAnalyticsScripts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LocaleProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <BrandSplash>
                  <App />
                </BrandSplash>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </LocaleProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
