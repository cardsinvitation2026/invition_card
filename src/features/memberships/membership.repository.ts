import type {
  MembershipCreateData,
  MembershipDetail,
  MembershipListQuery,
  MembershipListResult,
  MembershipUpdateData,
} from '@/types/membership-engine';

export interface MembershipRepository {
  findById(id: string): Promise<MembershipDetail | null>;
  listByUser(userId: string, query: MembershipListQuery): Promise<MembershipListResult>;
  listAll(query: MembershipListQuery): Promise<MembershipListResult>;
  create(input: MembershipCreateData): Promise<MembershipDetail>;
  update(id: string, input: MembershipUpdateData): Promise<MembershipDetail>;
  findActiveMemberships(userId: string): Promise<MembershipDetail[]>;
  countByUser(userId: string): Promise<number>;
}
