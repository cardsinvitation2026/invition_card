import 'server-only';
import type { MembershipDetail } from '@/types/membership-engine';
import type { MembershipRepository } from './membership.repository';

function isPastEndDate(endDate: string, now: Date): boolean {
  return new Date(endDate).getTime() < now.getTime();
}

export async function expireMembershipsIfNeeded(
  repo: MembershipRepository,
  memberships: MembershipDetail[],
  now: Date = new Date(),
): Promise<MembershipDetail[]> {
  const valid: MembershipDetail[] = [];

  for (const membership of memberships) {
    if (membership.status !== 'ACTIVE') {
      continue;
    }

    if (isPastEndDate(membership.endDate, now)) {
      await repo.update(membership.id, { status: 'EXPIRED' });
      continue;
    }

    valid.push(membership);
  }

  return valid;
}
