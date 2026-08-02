/**
 * Navigation param lists.
 * Why: typed routes for auth + authenticated tabs/stack.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';
import type {
  ContentReportTargetType,
  ContentReportType,
  FeedbackType,
} from '@sharanam/shared';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: { announcementId?: string } | undefined;
  CoursesTab: { categoryId?: string } | undefined;
  TestsTab: undefined;
  LiveTab: undefined;
  MyLearningTab: undefined;
  ProfileTab: undefined;
};

/** Drawer wraps bottom tabs (hamburger sidebar). */
export type MainDrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainDrawerParamList> | undefined;
  CourseDetail: { courseId: string };
  BuyCourse: { courseId: string };
  PaymentSuccess: { courseId: string; courseTitle?: string };
  PaymentFailed: { courseId: string; message?: string };
  PurchaseHistory: undefined;
  NotificationCenter: undefined;
  EditProfile: undefined;
  LearningProgress: undefined;
  Certificates: undefined;
  CertificateViewer: { certificateId: string };
  Achievements: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
  LanguageSettings: undefined;
  LegalDocument: { doc: 'privacy' | 'terms' };
  About: undefined;
  ChangePassword: undefined;
  TestHistory: undefined;
  Feedback: undefined;
  SubmitFeedback: { type?: FeedbackType } | undefined;
  MyFeedback: undefined;
  FeedbackDetail: { feedbackId: string };
  AppReview: { courseId?: string } | undefined;
  Support: undefined;
  FAQ: undefined;
  ContactUs: undefined;
  BugReport: undefined;
  MyBugReports: undefined;
  BugReportDetail: { reportId: string };
  ReportContent:
    | {
        report_type?: ContentReportType;
        target_type?: ContentReportTargetType;
        target_id?: string;
        course_id?: string;
        chapter_id?: string;
        target_label?: string;
      }
    | undefined;
  MyContentReports: undefined;
  ContentReportDetail: { reportId: string };
  FeatureRequest: undefined;
  ChatSupport: { ticketId?: string } | undefined;
  ChapterList: { courseId: string; courseTitle?: string };
  ChapterContent: { courseId: string; chapterId: string };
  VideoPlayer: { courseId: string; chapterId: string; videoId: string };
  PdfViewer: { courseId: string; chapterId: string; pdfId: string };
  NoteViewer: { courseId: string; chapterId: string; noteId: string };
  TestList: undefined;
  TestAttempt: { attemptId: string; testId: string };
  TestResult: { attemptId: string };
  TestReview: { attemptId: string };
  Leaderboard: undefined;
  TestAnalytics: undefined;
};

export type RootStackParamList = AuthStackParamList & AppStackParamList & MainTabParamList;
