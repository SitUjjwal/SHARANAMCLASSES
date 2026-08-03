/**
 * Admin monitoring API client — Module 11.
 */
import type { MonitoringOverview } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export function fetchMonitoringOverview() {
  return apiRequest<MonitoringOverview>('/admin/monitoring/overview');
}
