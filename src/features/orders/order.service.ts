import 'server-only';
import type { OrderRepository } from './order.repository';
import { prismaOrderRepository } from './prisma-order.repository';
import { inMemoryOrderRepository } from './inmemory-order.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type { OrderCreateData, OrderListQuery, OrderUpdateData } from '@/types/order';
import type { OrderListQueryInput } from '@/validations/order.validation';

function repo(): OrderRepository {
  return hasDatabaseUrl() ? prismaOrderRepository : inMemoryOrderRepository;
}

function toListQuery(input: OrderListQueryInput): OrderListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    status: input.status,
  };
}

export const orderService = {
  async getOrder(id: string) {
    return repo().findById(id);
  },

  async getOrderForUser(id: string, userId: string) {
    const order = await repo().findById(id);
    if (!order || order.userId !== userId) {
      return null;
    }
    return order;
  },

  async listOrdersByUser(userId: string, input: OrderListQueryInput) {
    return repo().listByUser(userId, toListQuery(input));
  },

  async listAllOrders(input: OrderListQueryInput) {
    return repo().listAll(toListQuery(input));
  },

  async createOrder(input: OrderCreateData) {
    return repo().create(input);
  },

  async updateOrder(id: string, input: OrderUpdateData) {
    return repo().update(id, input);
  },

  async findOrderByMembershipId(membershipId: string) {
    return repo().findByMembershipId(membershipId);
  },
};
