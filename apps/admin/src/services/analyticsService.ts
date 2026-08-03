/**
 * analyticsService — dashboard, revenue, and analytics overview.
 */
import type {
  AdminAnalyticsOverview,
  AdminDashboardOverview,
  AdminRevenueOverview,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function fetchDashboardOverview(): Promise<AdminDashboardOverview> {
  return apiRequest<AdminDashboardOverview>('/dashboard');
}

export async function fetchRevenueOverview(): Promise<AdminRevenueOverview> {
  return apiRequest<AdminRevenueOverview>('/admin/revenue/overview');
}

export async function fetchAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  return apiRequest<AdminAnalyticsOverview>('/analytics');
}
