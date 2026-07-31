/**
 * Navigation param lists.
 * Why: typed routes for auth + authenticated tabs/stack.
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CoursesTab: { categoryId?: string } | undefined;
  MyLearningTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CourseDetail: { courseId: string };
  ChapterList: { courseId: string; courseTitle?: string };
  ChapterContent: { courseId: string; chapterId: string };
};

export type RootStackParamList = AuthStackParamList & AppStackParamList & MainTabParamList;
