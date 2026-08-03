/**
 * Admin Analytics Dashboard chart payload types.
 */

export type AdminAnalyticsChartPoint = {
  label: string;
  value: number;
};

export type AdminAnalyticsRankItem = {
  id: string;
  label: string;
  value: number;
  meta?: string;
};

export type AdminAnalyticsOverview = {
  timezone: string;
  kpis: {
    total_students: number;
    active_students: number;
    total_enrollments: number;
    monthly_revenue_display: string;
    avg_test_score: number;
    pass_rate: number;
    live_classes_today: number;
  };
  student_growth: AdminAnalyticsChartPoint[];
  revenue_growth: AdminAnalyticsChartPoint[];
  course_popularity: AdminAnalyticsRankItem[];
  most_viewed_videos: AdminAnalyticsRankItem[];
  most_downloaded_pdfs: AdminAnalyticsRankItem[];
  live_class_attendance: AdminAnalyticsRankItem[];
  average_test_scores: AdminAnalyticsChartPoint[];
};
