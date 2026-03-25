import './styles/main.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { App } from './App';
import { debugInjectTestEvents, debugGetCells, getCellCount } from '@/services/geo-convergence';
import { initMetaTags } from '@/services/meta-tags';
import { init } from './i18n';

// Initialize Vercel Analytics only in production
if (import.meta.env.PROD) {
  import('@vercel/analytics').then(({ inject }) => {
    inject();
  }).catch(() => {
    // Analytics not available in dev
  });
}

// Initialize dynamic meta tags for sharing
initMetaTags();

// Initialize i18n
init().then(() => {
  const app = new App('app');
  app.init().catch(console.error);
}).catch(console.error);

// Debug helpers for geo-convergence testing (remove in production)
(window as unknown as Record<string, unknown>).geoDebug = {
  inject: debugInjectTestEvents,
  cells: debugGetCells,
  count: getCellCount,
};
