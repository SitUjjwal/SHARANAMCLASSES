/**
 * Admin app routes — auth gate + staff RBAC + sidebar menu.
 * AuthProvider + ThemeProvider wrap the tree in main.tsx.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DocumentTitle } from '@/components/DocumentTitle';
import { NotFoundPage } from '@/components/NotFoundPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth, RequireStaff } from '@/features/auth/RequireAuth';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabaseEnvOk } from '@/lib/supabase';
import {
  ActivityLogsPage,
  AnalyticsPage,
  AnnouncementsPage,
  BannersPage,
  BackupsPage,
  BatchesPage,
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
  MonitoringPage,
  NotesPage,
  NotificationsDashboardPage,
  NotificationsPage,
  PaymentsPage,
  PdfsPage,
  QuestionsHubPage,
  QuestionsPage,
  ReminderEnginePage,
  ReportsPage,
  ResultsPage,
  RevenuePage,
  ReviewsPage,
  RolesPage,
  SettingsPage,
  StudentsPage,
  SupportChatPage,
  TeachersPage,
  TestimonialsPage,
  TestsPage,
  VersionsPage,
  VideosPage,
} from '@/pages';

export function App() {
  if (!supabaseEnvOk) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Admin config missing</h1>
          <p className="form-error">
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY were empty at build time. On Vercel: Settings
            → Environment Variables → <strong>Production</strong> pe set karo, phir Redeploy (cache
            off).
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <DocumentTitle />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<RequireStaff />}>
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
              <Route path="batches" element={<BatchesPage />} />
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
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="backups" element={<BackupsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="versions" element={<VersionsPage />} />
              <Route path="roles" element={<RolesPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
