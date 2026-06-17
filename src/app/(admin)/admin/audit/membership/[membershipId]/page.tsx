import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MembershipAuditClient } from '@/components/admin/audit/MembershipAuditClient';

export const metadata = { title: 'Membership Audit' };

export default async function AdminMembershipAuditPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MembershipAuditClient membershipId={membershipId} />
    </Suspense>
  );
}
