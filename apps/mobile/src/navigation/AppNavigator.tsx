/**
 * Authenticated stack: tabs + course / chapter / video / PDF / notes screens.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChapterContentScreen, ChapterListScreen } from '@/modules/chapters';
import { NoteViewerScreen } from '@/modules/notes';
import { BuyCourseScreen, PurchaseHistoryScreen } from '@/modules/payments';
import { PaymentFailedScreen } from '@/modules/payments/screens/PaymentFailedScreen';
import { PaymentSuccessScreen } from '@/modules/payments/screens/PaymentSuccessScreen';
import { PdfViewerScreen } from '@/modules/pdfs';
import { NotificationCenterScreen } from '@/modules/notifications';
import {
  AchievementsScreen,
  CertificateViewerScreen,
  CertificatesScreen,
  ChangePasswordScreen,
  EditProfileScreen,
  LearningProgressScreen,
  TestHistoryScreen,
} from '@/modules/profile';
import {
  AboutScreen,
  LanguageSettingsScreen,
  LegalDocumentScreen,
  NotificationPreferencesScreen,
  SettingsScreen,
} from '@/modules/settings';
import {
  TestListScreen,
  TestScreen,
  ResultScreen,
  ReviewScreen,
  LeaderboardScreen,
  AnalyticsDashboardScreen,
} from '@/modules/tests';
import { VideoPlayerScreen } from '@/modules/videos';
import { MainDrawerNavigator } from '@/navigation/MainDrawerNavigator';
import { CourseDetailScreen } from '@/screens/CourseDetailScreen';
import type { AppStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainDrawerNavigator} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="BuyCourse" component={BuyCourseScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentFailed" component={PaymentFailedScreen} />
      <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="LearningProgress" component={LearningProgressScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="CertificateViewer" component={CertificateViewerScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
      />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="TestHistory" component={TestHistoryScreen} />
      <Stack.Screen name="ChapterList" component={ChapterListScreen} />
      <Stack.Screen name="ChapterContent" component={ChapterContentScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="NoteViewer" component={NoteViewerScreen} />
      <Stack.Screen name="TestList" component={TestListScreen} />
      <Stack.Screen name="TestAttempt" component={TestScreen} />
      <Stack.Screen name="TestResult" component={ResultScreen} />
      <Stack.Screen name="TestReview" component={ReviewScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="TestAnalytics" component={AnalyticsDashboardScreen} />
    </Stack.Navigator>
  );
}
