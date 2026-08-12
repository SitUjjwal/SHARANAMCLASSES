/**
 * Full-viewport loading state (auth bootstrap, route suspense).
 */
export function LoadingPage({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="loading-page" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-page-inner">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
}
