import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { PlatformProvider } from '@/features/platform/PlatformProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { App } from './App';
import './styles/global.css';

const rootEl = document.getElementById('root')!;

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <PlatformProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PlatformProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Hide HTML boot splash once React has mounted
queueMicrotask(() => {
  document.getElementById('boot-loader')?.setAttribute('hidden', '');
});
