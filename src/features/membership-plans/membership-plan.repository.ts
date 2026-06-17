import type {
  MembershipPlanCreateData,
  MembershipPlanDetail,
  MembershipPlanListItem,
  MembershipPlanListQuery,
  MembershipPlanListResult,
  MembershipPlanUpdateData,
} from '@/types/membership-plan';

export interface MembershipPlanRepository {
  findById(id: string): Promise<MembershipPlanDetail | null>;
  findByName(name: string): Promise<MembershipPlanDetail | null>;
  list(query: MembershipPlanListQuery): Promise<MembershipPlanListResult>;
  create(input: MembershipPlanCreateData): Promise<MembershipPlanDetail>;
  update(id: string, input: MembershipPlanUpdateData): Promise<MembershipPlanDetail>;
  softDelete(id: string): Promise<void>;
  listActivePlans(): Promise<MembershipPlanListItem[]>;
}
