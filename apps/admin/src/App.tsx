/**
 * Admin app routes — auth gate + sidebar menu.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AnalyticsPage,
  AnnouncementsPage,
  BannersPage,
  BugReportsPage,
  CategoriesPage,
  CertificatesPage,
  ChaptersPage,
  ContentReportsPage,
  CoursesPage,
  DashboardPage,
  FaqsPage,
  FeedbackDashboardPage,
  FeedbackTicketsPage,
  LeaderboardPage,
  LiveClassesPage,
  NotesPage,
  NotificationsDashboardPage,
  NotificationsPage,
  PaymentsPage,
  PdfsPage,
  QuestionsHubPage,
  QuestionsPage,
  ReminderEnginePage,
  ResultsPage,
  ReviewsPage,
  StudentsPage,
  SupportChatPage,
  TeachersPage,
  TestimonialsPage,
  TestsPage,
  VideosPage,
} from '@/pages';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="reminder-engine" element={<ReminderEnginePage />} />
              <Route path="delivery-reports" element={<NotificationsDashboardPage />} />
              <Route
                path="notification-dashboard"
                element={<Navigate to="/delivery-reports" replace />}
              />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="feedback" element={<FeedbackTicketsPage />} />
              <Route path="feedback-dashboard" element={<FeedbackDashboardPage />} />
              <Route path="bug-reports" element={<BugReportsPage />} />
              <Route path="faqs" element={<FaqsPage />} />
              <Route path="support-chat" element={<SupportChatPage />} />
              <Route path="content-reports" element={<ContentReportsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="tests" element={<TestsPage />} />
              <Route path="questions" element={<QuestionsHubPage />} />
              <Route path="tests/:testId/questions" element={<QuestionsPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="chapters" element={<ChaptersPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="pdfs" element={<PdfsPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="live-classes" element={<LiveClassesPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
