import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { PlatformProvider } from '@/features/platform/PlatformProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { App } from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PlatformProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PlatformProvider>
    </ThemeProvider>
  </StrictMode>,
);
