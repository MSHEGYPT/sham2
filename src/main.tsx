import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Global event listener to gracefully ignore benign stream cancellations (AbortError)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    if (
      reason?.name === 'AbortError' ||
      reason?.code === 20 ||
      (typeof reason?.message === 'string' &&
        (reason.message.includes('signal is aborted') || reason.message.includes('AbortError')))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const err = event?.error;
    if (
      err?.name === 'AbortError' ||
      (typeof event?.message === 'string' &&
        (event.message.includes('signal is aborted') || event.message.includes('AbortError')))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
