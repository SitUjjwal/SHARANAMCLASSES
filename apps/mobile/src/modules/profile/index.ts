/**
 * Profile module public API.
 */
export { ProfileScreen } from './screens/ProfileScreen';
export { EditProfileScreen } from './screens/EditProfileScreen';
export { LearningProgressScreen } from './screens/LearningProgressScreen';
export { CertificatesScreen } from './screens/CertificatesScreen';
export { CertificateViewerScreen } from './screens/CertificateViewerScreen';
export { AchievementsScreen } from './screens/AchievementsScreen';
export { SettingsScreen } from '@/modules/settings';
export { ChangePasswordScreen } from './screens/ChangePasswordScreen';
export { TestHistoryScreen } from './screens/TestHistoryScreen';

export { ProfileCard } from './components/ProfileCard';
export { ProfilePhoto } from './components/ProfilePhoto';
export { ProfileFieldRow } from './components/ProfileFieldRow';
export { ProfileStatsRow } from './components/ProfileStatsRow';
export { AvatarPicker } from './components/AvatarPicker';
export { ProgressBar } from './components/ProgressBar';
export { LearningProgressSummaryCard } from './components/LearningProgressSummaryCard';
export { ContinueLearningCard } from './components/ContinueLearningCard';
export { ProgressCard } from './components/ProgressCard';
export { CertificateCard } from './components/CertificateCard';
export { AchievementCard } from './components/AchievementCard';
export { TestHistoryCard } from './components/TestHistoryCard';
export { SettingItem } from './components/SettingItem';

export { useProfileQuery } from './hooks/useProfileQuery';
export { useProfileOverviewQuery } from './hooks/useProfileOverviewQuery';
export { useUpdateProfileMutation } from './hooks/useUpdateProfileMutation';
export { useLearningProgressQuery } from './hooks/useLearningProgressQuery';
export { useTestHistoryQuery } from './hooks/useTestHistoryQuery';

export {
  editProfileSchema,
  type EditProfileFormValues,
} from './schemas/editProfileSchema';

export {
  fetchProfile,
  fetchProfileOverview,
  updateProfile,
  uploadProfileAvatar,
  fetchLearningProgress,
  fetchCertificates,
  fetchCertificate,
  requestCertificate,
  fetchAchievements,
} from './services/profileService';
export { fetchTestHistory } from './services/testHistoryService';
