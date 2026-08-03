/**
 * Wrap async DB work to record latency into the metrics store.
 */
import { metricsStore } from './metricsStore';

export async function withDbTiming<T>(
  _label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    metricsStore.recordDbQuery(Date.now() - started, true);
    return result;
  } catch (err) {
    metricsStore.recordDbQuery(
      Date.now() - started,
      false,
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}
