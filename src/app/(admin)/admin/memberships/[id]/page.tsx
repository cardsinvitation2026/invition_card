import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MembershipDetailClient } from '@/components/admin/memberships/MembershipDetailClient';

export const metadata = { title: 'Membership Details' };

export default async function AdminMembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MembershipDetailClient membershipId={id} />
    </Suspense>
  );
}
