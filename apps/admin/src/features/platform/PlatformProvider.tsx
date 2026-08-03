/**
 * Loads public platform branding once for logo + primary color.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { PublicPlatformConfig } from '@sharanam/shared';

import { fetchPublicPlatform } from '@/services/platformService';

type PlatformContextValue = {
  config: PublicPlatformConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PlatformContext = createContext<PlatformContextValue>({
  config: null,
  loading: true,
  refresh: async () => undefined,
});

const FALLBACK: PublicPlatformConfig = {
  app_name: 'SHARANAM CLASSES',
  logo_url: '',
  primary_color: '#0B6E4F',
  support_email: '',
  support_phone: '',
  privacy_policy: '',
  terms: '',
  maintenance_mode: false,
  app_version: '1.0.0',
  min_app_version: '1.0.0',
  timezone: 'Asia/Kolkata',
  updated_at: null,
};

function applyBrandCss(data: PublicPlatformConfig) {
  if (data.primary_color) {
    document.documentElement.style.setProperty('--brand-primary', data.primary_color);
  }
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicPlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPublicPlatform();
      setConfig(data);
      applyBrandCss(data);
    } catch {
      setConfig((prev) => prev ?? FALLBACK);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void refresh().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ config, loading, refresh }),
    [config, loading, refresh],
  );
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  return useContext(PlatformContext);
}

export function useBrandLogo(): string {
  const { config } = usePlatform();
  return config?.logo_url?.trim() || '/logo.png';
}

export function useBrandName(): string {
  const { config } = usePlatform();
  return config?.app_name?.trim() || 'SHARANAM CLASSES';
}
