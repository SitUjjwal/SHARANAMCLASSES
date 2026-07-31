/**
 * Navigation param lists.
 * Why: typed routes for auth + authenticated tabs/stack.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CoursesTab: { categoryId?: string } | undefined;
  LiveTab: undefined;
  MyLearningTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CourseDetail: { courseId: string };
  ChapterList: { courseId: string; courseTitle?: string };
  ChapterContent: { courseId: string; chapterId: string };
  VideoPlayer: { courseId: string; chapterId: string; videoId: string };
  PdfViewer: { courseId: string; chapterId: string; pdfId: string };
  NoteViewer: { courseId: string; chapterId: string; noteId: string };
};

export type RootStackParamList = AuthStackParamList & AppStackParamList & MainTabParamList;
