import 'server-only';
import type { OrderRepository } from './order.repository';
import type {
  Order,
  OrderCreateData,
  OrderListQuery,
  OrderStatus,
  OrderUpdateData,
} from '@/types/order';
import { getPrisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

type DbClient = Prisma.TransactionClient | ReturnType<typeof db>;

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

function toOrder(row: {
  id: string;
  userId: string;
  membershipId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Order {
  return {
    id: row.id,
    userId: row.userId,
    membershipId: row.membershipId,
    amount: row.amount,
    currency: row.currency,
    status: toStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(query: OrderListQuery, userId?: string) {
  return {
    ...(userId ? { userId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

export const prismaOrderRepository: OrderRepository = {
  async findById(id) {
    const row = await db().order.findUnique({ where: { id } });
    return row ? toOrder(row) : null;
  },

  async listByUser(userId, query) {
    const where = buildWhere(query, userId);
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().order.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db().order.count({ where }),
    ]);
    return {
      items: rows.map(toOrder),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async listAll(query) {
    const where = buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().order.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db().order.count({ where }),
    ]);
    return {
      items: rows.map(toOrder),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async create(input: OrderCreateData) {
    const row = await db().order.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        membershipId: input.membershipId ?? null,
      },
    });
    return toOrder(row);
  },

  async update(id, input: OrderUpdateData) {
    const row = await db().order.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.membershipId !== undefined ? { membershipId: input.membershipId } : {}),
      },
    });
    return toOrder(row);
  },

  async findByMembershipId(membershipId) {
    const row = await db().order.findFirst({ where: { membershipId } });
    return row ? toOrder(row) : null;
  },
};

export async function prismaOrderUpdateInTransaction(
  tx: Prisma.TransactionClient,
  id: string,
  input: OrderUpdateData,
): Promise<Order> {
  const row = await tx.order.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.membershipId !== undefined ? { membershipId: input.membershipId } : {}),
    },
  });
  return toOrder(row);
}

export async function prismaLockOrderRow(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<Order | null> {
  const rows = await tx.$queryRaw<
    Array<{
      id: string;
      userId: string;
      membershipId: string | null;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >`
    SELECT id, "userId", "membershipId", amount, currency, status, "createdAt", "updatedAt"
    FROM "Order"
    WHERE id = ${orderId}
    FOR UPDATE
  `;
  const row = rows[0];
  return row ? toOrder(row) : null;
}

export async function prismaCompleteOrderIfPending(
  tx: Prisma.TransactionClient,
  orderId: string,
  membershipId: string,
): Promise<boolean> {
  const result = await tx.order.updateMany({
    where: {
      id: orderId,
      status: 'PENDING',
      membershipId: null,
    },
    data: {
      status: 'COMPLETED',
      membershipId,
    },
  });
  return result.count === 1;
}
