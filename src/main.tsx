import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';
import './index.css';

// Register Service Worker for PWA & Web Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('KMR Remind Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service worker registration error:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ReminderProvider>
          <App />
        </ReminderProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

