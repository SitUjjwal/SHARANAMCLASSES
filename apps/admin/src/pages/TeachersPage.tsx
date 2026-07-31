import { PageHeader, PlaceholderPanel } from '@/components/PageHeader';

export function TeachersPage() {
  return (
    <div className="page">
      <PageHeader
        title="Teachers"
        description="Instructor accounts and course assignments."
      />
      <PlaceholderPanel title="Teacher management" />
    </div>
  );
}
