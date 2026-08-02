/**
 * Settings store — local preferences (SecureStore), drives Dark Mode / Language / notifications.
 */
import { create } from 'zustand';

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'sharanam.settings.v1';

export type AppLanguage = 'en' | 'hi';

export type NotificationPreferences = {
  pushEnabled: boolean;
  courses: boolean;
  tests: boolean;
  liveClasses: boolean;
  payments: boolean;
  announcements: boolean;
};

export type SettingsState = {
  hydrated: boolean;
  darkMode: boolean;
  language: AppLanguage;
  notifications: NotificationPreferences;
  hydrate: () => Promise<void>;
  setDarkMode: (value: boolean) => void;
  setLanguage: (value: AppLanguage) => void;
  setNotificationPref: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => void;
};

const defaultNotifications: NotificationPreferences = {
  pushEnabled: true,
  courses: true,
  tests: true,
  liveClasses: true,
  payments: true,
  announcements: true,
};

type PersistedSlice = {
  darkMode: boolean;
  language: AppLanguage;
  notifications: NotificationPreferences;
};

async function persist(slice: PersistedSlice): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // Device storage unavailable — keep in-memory prefs
  }
}

function snapshot(state: SettingsState): PersistedSlice {
  return {
    darkMode: state.darkMode,
    language: state.language,
    notifications: state.notifications,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  darkMode: true,
  language: 'en',
  notifications: { ...defaultNotifications },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSlice>;
        set({
          darkMode: parsed.darkMode ?? true,
          language: parsed.language === 'hi' ? 'hi' : 'en',
          notifications: {
            ...defaultNotifications,
            ...(parsed.notifications ?? {}),
          },
          hydrated: true,
        });
        return;
      }
    } catch {
      // fall through
    }
    set({ hydrated: true });
  },

  setDarkMode: (value) => {
    set({ darkMode: value });
    void persist(snapshot(get()));
  },

  setLanguage: (value) => {
    set({ language: value });
    void persist(snapshot(get()));
  },

  setNotificationPref: (key, value) => {
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    }));
    void persist(snapshot(get()));
  },
}));
