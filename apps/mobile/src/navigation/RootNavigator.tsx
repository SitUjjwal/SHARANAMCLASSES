/**
 * Root navigator — automatic redirect based on Zustand auth status.
 *
 * Always shows the brand photo full-screen first (~3s), even if session
 * restore is instant — otherwise Login appears immediately.
 */
import { useEffect, useState } from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { useAuth } from '@/hooks/useAuth';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { useAuthStore } from '@/store/authStore';
import type { RootStackParamList } from '@/types/navigation';

/** Minimum time the brand photo stays on screen after open */
const MIN_BRAND_SPLASH_MS = 3000;

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'sharanam://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      MainTabs: {
        path: '',
        screens: {
          HomeTab: 'home',
          CoursesTab: 'courses',
          LiveTab: 'live',
          MyLearningTab: 'my-learning',
          ProfileTab: 'profile',
        },
      },
      CourseDetail: 'course/:courseId',
      BuyCourse: 'course/:courseId/buy',
      ChapterList: 'course/:courseId/chapters',
      ChapterContent: 'course/:courseId/chapters/:chapterId',
      VideoPlayer: 'course/:courseId/chapters/:chapterId/videos/:videoId',
      PdfViewer: 'course/:courseId/chapters/:chapterId/pdfs/:pdfId',
      NoteViewer: 'course/:courseId/chapters/:chapterId/notes/:noteId',
    },
  },
};

export function RootNavigator() {
  const { status, isLoading } = useAuth();
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const [brandSplashDone, setBrandSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBrandSplashDone(true);
    }, MIN_BRAND_SPLASH_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Brand photo first — do not skip even when auth is already ready
  if (!brandSplashDone || isLoading || status === 'loading') {
    return <LoadingScreen />;
  }

  if (isPasswordRecovery) {
    return (
      <NavigationContainer linking={linking}>
        <AuthNavigator initialRouteName="ResetPassword" />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {status === 'authenticated' ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
