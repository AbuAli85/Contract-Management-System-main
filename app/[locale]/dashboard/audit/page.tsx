import AuditLogsPage from '@/app/dashboard/audit/page';

export default async function LocaleAuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AuditLogsPage />;
}