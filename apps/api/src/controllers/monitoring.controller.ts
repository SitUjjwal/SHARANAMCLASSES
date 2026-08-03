/**
 * GET /admin/monitoring/overview — live ops metrics dashboard payload.
 * GET /alerts — recent threshold alerts
 * POST /alerts/:id/ack — acknowledge alert
 */
import type { NextFunction, Request, Response } from 'express';

import { alertStore } from '../monitoring/alertStore';
import { metricsStore } from '../monitoring/metricsStore';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function overviewWithAlerts() {
  const overview = metricsStore.getOverview();
  alertStore.evaluate(overview);
  overview.alerts = alertStore.list(30);
  overview.active_alert_count = alertStore.activeCount();
  return overview;
}

export function getMonitoringOverviewHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    res.status(200).json({ success: true, data: overviewWithAlerts() });
  } catch (error) {
    next(error);
  }
}

export function getAlertsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Keep rules fresh when someone only polls /alerts
    alertStore.evaluate(metricsStore.getOverview());
    const limit = Number(req.query.limit ?? 50) || 50;
    res.status(200).json({
      success: true,
      data: {
        active_count: alertStore.activeCount(),
        alerts: alertStore.list(limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export function acknowledgeAlertHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const id = requireParam(req.params.id, 'id');
    const alert = alertStore.acknowledge(id);
    if (!alert) {
      throw new AppError(404, 'ALERT_NOT_FOUND', 'Alert not found');
    }
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
}
