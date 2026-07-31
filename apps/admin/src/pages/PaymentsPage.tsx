import { PageHeader, PlaceholderPanel } from '@/components/PageHeader';

export function PaymentsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Payments"
        description="Track course purchases, refunds, and payment status."
      />
      <PlaceholderPanel title="Payments overview" />
    </div>
  );
}
