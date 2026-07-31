import { PageHeader, PlaceholderPanel } from '@/components/PageHeader';

export function CategoriesPage() {
  return (
    <div className="page">
      <PageHeader
        title="Categories"
        description="Organize subjects shown on Home and the Courses tab."
      />
      <PlaceholderPanel title="Category management" />
    </div>
  );
}
