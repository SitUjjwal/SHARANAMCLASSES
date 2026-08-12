/**
 * Authenticated stack: tabs + course / chapter / video / PDF / notes screens.
 *
 * Heavy secondary screens use `getComponent` so Metro only evaluates their
 * module graph on first navigation (code splitting / smaller startup bundle).
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainDrawerNavigator } from '@/navigation/MainDrawerNavigator';
import type { AppStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainDrawerNavigator} />
      <Stack.Screen
        name="CourseDetail"
        getComponent={() => require('@/screens/CourseDetailScreen').CourseDetailScreen}
      />
      <Stack.Screen
        name="BuyCourse"
        getComponent={() => require('@/modules/payments').BuyCourseScreen}
      />
      <Stack.Screen
        name="PaymentSuccess"
        getComponent={() =>
          require('@/modules/payments/screens/PaymentSuccessScreen').PaymentSuccessScreen
        }
      />
      <Stack.Screen
        name="PaymentFailed"
        getComponent={() =>
          require('@/modules/payments/screens/PaymentFailedScreen').PaymentFailedScreen
        }
      />
      <Stack.Screen
        name="PurchaseHistory"
        getComponent={() => require('@/modules/payments').PurchaseHistoryScreen}
      />
      <Stack.Screen
        name="NotificationCenter"
        getComponent={() => require('@/modules/notifications').NotificationCenterScreen}
      />
      <Stack.Screen
        name="EditProfile"
        getComponent={() => require('@/modules/profile').EditProfileScreen}
      />
      <Stack.Screen
        name="LearningProgress"
        getComponent={() => require('@/modules/profile').LearningProgressScreen}
      />
      <Stack.Screen
        name="Certificates"
        getComponent={() => require('@/modules/profile').CertificatesScreen}
      />
      <Stack.Screen
        name="CertificateViewer"
        getComponent={() => require('@/modules/profile').CertificateViewerScreen}
      />
      <Stack.Screen
        name="Achievements"
        getComponent={() => require('@/modules/profile').AchievementsScreen}
      />
      <Stack.Screen
        name="Settings"
        getComponent={() => require('@/modules/settings').SettingsScreen}
      />
      <Stack.Screen
        name="NotificationPreferences"
        getComponent={() => require('@/modules/settings').NotificationPreferencesScreen}
      />
      <Stack.Screen
        name="LanguageSettings"
        getComponent={() => require('@/modules/settings').LanguageSettingsScreen}
      />
      <Stack.Screen
        name="LegalDocument"
        getComponent={() => require('@/modules/settings').LegalDocumentScreen}
      />
      <Stack.Screen
        name="About"
        getComponent={() => require('@/modules/settings').AboutScreen}
      />
      <Stack.Screen
        name="ChangePassword"
        getComponent={() => require('@/modules/profile').ChangePasswordScreen}
      />
      <Stack.Screen
        name="TestHistory"
        getComponent={() => require('@/modules/profile').TestHistoryScreen}
      />
      <Stack.Screen
        name="Feedback"
        getComponent={() => require('@/modules/feedback').FeedbackScreen}
      />
      <Stack.Screen
        name="SubmitFeedback"
        getComponent={() => require('@/modules/feedback').SubmitFeedbackScreen}
      />
      <Stack.Screen
        name="MyFeedback"
        getComponent={() => require('@/modules/feedback').MyFeedbackScreen}
      />
      <Stack.Screen
        name="FeedbackDetail"
        getComponent={() => require('@/modules/feedback').FeedbackDetailScreen}
      />
      <Stack.Screen
        name="AppReview"
        getComponent={() => require('@/modules/feedback').ReviewScreen}
      />
      <Stack.Screen
        name="Support"
        getComponent={() => require('@/modules/feedback').SupportScreen}
      />
      <Stack.Screen
        name="FAQ"
        getComponent={() => require('@/modules/feedback').FAQScreen}
      />
      <Stack.Screen
        name="ContactUs"
        getComponent={() => require('@/modules/feedback').ContactUsScreen}
      />
      <Stack.Screen
        name="BugReport"
        getComponent={() => require('@/modules/feedback').BugReportScreen}
      />
      <Stack.Screen
        name="MyBugReports"
        getComponent={() => require('@/modules/feedback').MyBugReportsScreen}
      />
      <Stack.Screen
        name="BugReportDetail"
        getComponent={() => require('@/modules/feedback').BugReportDetailScreen}
      />
      <Stack.Screen
        name="ReportContent"
        getComponent={() => require('@/modules/feedback').ReportContentScreen}
      />
      <Stack.Screen
        name="MyContentReports"
        getComponent={() => require('@/modules/feedback').MyContentReportsScreen}
      />
      <Stack.Screen
        name="ContentReportDetail"
        getComponent={() => require('@/modules/feedback').ContentReportDetailScreen}
      />
      <Stack.Screen
        name="FeatureRequest"
        getComponent={() => require('@/modules/feedback').FeatureRequestScreen}
      />
      <Stack.Screen
        name="ChatSupport"
        getComponent={() => require('@/modules/feedback').ChatSupportScreen}
      />
      <Stack.Screen
        name="SubjectList"
        getComponent={() => require('@/modules/subjects').SubjectListScreen}
      />
      <Stack.Screen
        name="ChapterList"
        getComponent={() => require('@/modules/chapters').ChapterListScreen}
      />
      <Stack.Screen
        name="ChapterContent"
        getComponent={() => require('@/modules/chapters').ChapterContentScreen}
      />
      <Stack.Screen
        name="VideoPlayer"
        getComponent={() => require('@/modules/videos').VideoPlayerScreen}
      />
      <Stack.Screen
        name="PdfViewer"
        getComponent={() => require('@/modules/pdfs').PdfViewerScreen}
      />
      <Stack.Screen
        name="NoteViewer"
        getComponent={() => require('@/modules/notes').NoteViewerScreen}
      />
      <Stack.Screen
        name="TestList"
        getComponent={() => require('@/modules/tests').TestListScreen}
      />
      <Stack.Screen
        name="TestAttempt"
        getComponent={() => require('@/modules/tests').TestScreen}
      />
      <Stack.Screen
        name="TestResult"
        getComponent={() => require('@/modules/tests').ResultScreen}
      />
      <Stack.Screen
        name="TestReview"
        getComponent={() => require('@/modules/tests').ReviewScreen}
      />
      <Stack.Screen
        name="Leaderboard"
        getComponent={() => require('@/modules/tests').LeaderboardScreen}
      />
      <Stack.Screen
        name="TestAnalytics"
        getComponent={() => require('@/modules/tests').AnalyticsDashboardScreen}
      />
    </Stack.Navigator>
  );
}
