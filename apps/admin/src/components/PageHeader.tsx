/**
 * Shared page chrome for admin sections still under construction.
 */
type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
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
