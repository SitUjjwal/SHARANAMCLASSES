/**
 * Shared page chrome for admin sections.
 */
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  /** Primary actions (e.g. Create) — always visible above toolbars */
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}

type PlaceholderPanelProps = {
  title: string;
  hint?: string;
};

export function PlaceholderPanel({
  title,
  hint = 'This module will connect to the admin API next.',
}: PlaceholderPanelProps) {
  return (
    <section className="placeholder-panel">
      <h2>{title}</h2>
      <p>{hint}</p>
    </section>
  );
}
