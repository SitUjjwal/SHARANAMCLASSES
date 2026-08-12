/**
 * Process lifecycle flags for readiness + graceful shutdown.
 * Why: load balancers must stop routing before the HTTP server closes.
 */

let acceptingTraffic = true;

export function isAcceptingTraffic(): boolean {
  return acceptingTraffic;
}

/** Call at the start of SIGTERM/SIGINT handling. */
export function markShuttingDown(): void {
  acceptingTraffic = false;
}
