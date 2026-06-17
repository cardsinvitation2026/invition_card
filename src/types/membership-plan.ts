export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  validityDays: number;
  downloadLimit: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type MembershipPlanListItem = Pick<
  MembershipPlan,
  | 'id'
  | 'name'
  | 'description'
  | 'price'
  | 'currency'
  | 'validityDays'
  | 'downloadLimit'
  | 'active'
  | 'sortOrder'
>;

export type MembershipPlanDetail = MembershipPlan;

export interface MembershipPlanListQuery {
  page: number;
  pageSize: number;
  active?: boolean;
}

export interface MembershipPlanListResult {
  items: MembershipPlanListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MembershipPlanCreateData {
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  validityDays: number;
  downloadLimit?: number | null;
  active: boolean;
  sortOrder: number;
}

export type MembershipPlanUpdateData = Partial<MembershipPlanCreateData>;
