import type {
  Order,
  OrderCreateData,
  OrderListQuery,
  OrderListResult,
  OrderUpdateData,
} from '@/types/order';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  listByUser(userId: string, query: OrderListQuery): Promise<OrderListResult>;
  listAll(query: OrderListQuery): Promise<OrderListResult>;
  create(input: OrderCreateData): Promise<Order>;
  update(id: string, input: OrderUpdateData): Promise<Order>;
  findByMembershipId(membershipId: string): Promise<Order | null>;
}
