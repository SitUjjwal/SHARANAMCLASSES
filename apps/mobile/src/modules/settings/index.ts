/**
 * Settings module — preferences hub + Dark Mode theme wiring.
 */
export { SettingsScreen } from './screens/SettingsScreen';
export { NotificationPreferencesScreen } from './screens/NotificationPreferencesScreen';
export { LanguageSettingsScreen } from './screens/LanguageSettingsScreen';
export { LegalDocumentScreen } from './screens/LegalDocumentScreen';
export { AboutScreen } from './screens/AboutScreen';
export { SettingToggle } from './components/SettingToggle';
export {
  useSettingsStore,
  type AppLanguage,
  type NotificationPreferences,
} from './store/settingsStore';
