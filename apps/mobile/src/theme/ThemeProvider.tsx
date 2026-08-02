/**
 * ThemeProvider — maps Settings.darkMode → AppPalette for Screen / Settings UI.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { StatusBar } from 'expo-status-bar';

import { useSettingsStore } from '@/modules/settings/store/settingsStore';
import {
  darkPalette,
  lightPalette,
  type AppPalette,
} from '@/theme/palettes';

const ThemeContext = createContext<AppPalette>(darkPalette);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const palette = useMemo(
    () => (darkMode ? darkPalette : lightPalette),
    [darkMode],
  );

  if (!hydrated) {
    return (
      <ThemeContext.Provider value={darkPalette}>
        <StatusBar style="light" />
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={palette}>
      <StatusBar style={palette.statusBarStyle} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): AppPalette {
  return useContext(ThemeContext);
}
