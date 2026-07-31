/**
 * Admin app routes — auth gate + sidebar menu.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  BannersPage,
  CategoriesPage,
  ChaptersPage,
  CoursesPage,
  DashboardPage,
  PaymentsPage,
  StudentsPage,
  TeachersPage,
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
              <Route path="courses" element={<CoursesPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="chapters" element={<ChaptersPage />} />
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
