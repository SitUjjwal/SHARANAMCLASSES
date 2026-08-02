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
