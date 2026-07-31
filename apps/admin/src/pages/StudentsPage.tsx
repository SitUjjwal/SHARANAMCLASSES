import { PageHeader, PlaceholderPanel } from '@/components/PageHeader';

export function StudentsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Students"
        description="Student profiles, class levels, and enrollments."
      />
      <PlaceholderPanel title="Student management" />
    </div>
  );
}
