import 'server-only';
import { randomUUID } from 'node:crypto';
import type { OrderRepository } from './order.repository';
import type {
  Order,
  OrderCreateData,
  OrderListQuery,
  OrderStatus,
  OrderUpdateData,
} from '@/types/order';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_orders__: Map<string, Order> | undefined;
}

function store(): Map<string, Order> {
  if (!globalThis.__mi_inmem_orders__) {
    globalThis.__mi_inmem_orders__ = new Map();
  }
  return globalThis.__mi_inmem_orders__;
}

function toStatus(status: string): OrderStatus {
  if (
    status === 'PENDING' ||
    status === 'COMPLETED' ||
    status === 'FAILED' ||
    status === 'REFUNDED'
  ) {
    return status;
  }
  return 'PENDING';
}

function filterOrders(orders: Order[], query: OrderListQuery, userId?: string): Order[] {
  let list = orders;
  if (userId) {
    list = list.filter((o) => o.userId === userId);
  }
  if (query.status) {
    list = list.filter((o) => o.status === query.status);
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

function paginate(list: Order[], query: OrderListQuery) {
  const total = list.length;
  const skip = (query.page - 1) * query.pageSize;
  return {
    items: list.slice(skip, skip + query.pageSize),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export const inMemoryOrderRepository: OrderRepository = {
  async findById(id) {
    return store().get(id) ?? null;
  },

  async listByUser(userId, query) {
    const filtered = filterOrders([...store().values()], query, userId);
    return paginate(filtered, query);
  },

  async listAll(query) {
    const filtered = filterOrders([...store().values()], query);
    return paginate(filtered, query);
  },

  async create(input: OrderCreateData) {
    const now = new Date().toISOString();
    const created: Order = {
      id: randomUUID(),
      userId: input.userId,
      membershipId: input.membershipId ?? null,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    return created;
  },

  async update(id, input: OrderUpdateData) {
    const existing = store().get(id);
    if (!existing) {
      throw new Error('Order not found');
    }
    const updated: Order = {
      ...existing,
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.membershipId !== undefined ? { membershipId: input.membershipId } : {}),
      updatedAt: new Date().toISOString(),
    };
    store().set(id, updated);
    return updated;
  },

  async findByMembershipId(membershipId) {
    return [...store().values()].find((o) => o.membershipId === membershipId) ?? null;
  },
};
