/**
 * Catches React render errors so the admin shell does not go blank.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[admin] ErrorBoundary', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  override render() {
    if (this.state.error) {
      return (
        <div className="error-page" role="alert">
          <div className="error-page-card">
            <h1>Something went wrong</h1>
            <p className="muted">
              The admin panel hit an unexpected error. You can reload or return to the dashboard.
            </p>
            <pre className="error-page-detail">{this.state.error.message}</pre>
            <div className="error-page-actions">
              <button type="button" className="btn primary" onClick={() => window.location.reload()}>
                Reload
              </button>
              <button type="button" className="btn" onClick={this.reset}>
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
