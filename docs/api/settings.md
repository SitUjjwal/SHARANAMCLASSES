# Settings

Student preferences: Dark Mode, notifications, language, legal, about, version, logout.

## Architecture

```
App
 └─ ThemeProvider  ← reads useSettingsStore.darkMode
      └─ Screen canvas / StatusBar
 └─ SettingsStore (Zustand)
      └─ SecureStore key `sharanam.settings.v1`
           darkMode, language, notification prefs

SettingsScreen (hub)
 ├─ Dark Mode          → SettingToggle → store.setDarkMode
 ├─ Notification Prefs → NotificationPreferencesScreen
 ├─ Language           → LanguageSettingsScreen (en | hi)
 ├─ Privacy / Terms    → LegalDocumentScreen (static copy)
 ├─ About              → AboutScreen
 ├─ App Version        → expo-constants (read-only)
 └─ Logout             → useLogoutMutation
```

| Concern | Where it lives |
|---------|----------------|
| Preference state | `modules/settings/store/settingsStore.ts` |
| Persistence | Expo SecureStore (device-local, survives relaunch) |
| Theme | `theme/palettes.ts` + `ThemeProvider` → `useAppTheme()` |
| Screen background | `components/ui/Screen.tsx` uses `theme.canvas` |
| Legal copy | `modules/settings/constants/legalContent.ts` (en/hi) |

Dark Mode toggles **app canvas** immediately. Screens still on static `colors.*` keep brand navy tokens until migrated to `useAppTheme()`.

Notification toggles are **client preferences** (which categories the student wants). OS push permission and FCM registration remain separate (`NotificationProvider`).

Language currently drives Privacy / Terms / About text; course **medium** stays on the profile.

## Routes

| Route | Screen |
|-------|--------|
| `Settings` | Hub |
| `NotificationPreferences` | Channel toggles |
| `LanguageSettings` | English / हिन्दी |
| `LegalDocument` | `{ doc: 'privacy' \| 'terms' }` |
| `About` | Brand blurb + version |
