import 'server-only';
import type { PaymentRepository } from './payment.repository';
import type {
  Payment,
  PaymentCreateData,
  PaymentStatus,
  PaymentUpdateData,
} from '@/types/payment';
import { getPrisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toStatus(status: string): PaymentStatus {
  if (
    status === 'PENDING' ||
    status === 'SUCCESS' ||
    status === 'FAILED' ||
    status === 'REFUNDED'
  ) {
    return status;
  }
  return 'PENDING';
}

function toPayment(row: {
  id: string;
  orderId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  errorCode: string | null;
  errorDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    razorpaySignature: row.razorpaySignature,
    status: toStatus(row.status),
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    errorCode: row.errorCode,
    errorDesc: row.errorDesc,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const prismaPaymentRepository: PaymentRepository = {
  async findById(id) {
    const row = await db().payment.findUnique({ where: { id } });
    return row ? toPayment(row) : null;
  },

  async findByOrderId(orderId) {
    const row = await db().payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toPayment(row) : null;
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    const row = await db().payment.findUnique({ where: { razorpayPaymentId } });
    return row ? toPayment(row) : null;
  },

  async create(input: PaymentCreateData) {
    const row = await db().payment.create({
      data: {
        orderId: input.orderId,
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId ?? null,
        razorpaySignature: input.razorpaySignature ?? null,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        method: input.method ?? null,
        errorCode: input.errorCode ?? null,
        errorDesc: input.errorDesc ?? null,
      },
    });
    return toPayment(row);
  },

  async update(id, input: PaymentUpdateData) {
    const row = await db().payment.update({
      where: { id },
      data: {
        ...(input.razorpayOrderId !== undefined ? { razorpayOrderId: input.razorpayOrderId } : {}),
        ...(input.razorpayPaymentId !== undefined ? { razorpayPaymentId: input.razorpayPaymentId } : {}),
        ...(input.razorpaySignature !== undefined ? { razorpaySignature: input.razorpaySignature } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.errorCode !== undefined ? { errorCode: input.errorCode } : {}),
        ...(input.errorDesc !== undefined ? { errorDesc: input.errorDesc } : {}),
      },
    });
    return toPayment(row);
  },

  async listByOrder(orderId) {
    const rows = await db().payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPayment);
  },
};

export async function prismaPaymentUpdateInTransaction(
  tx: Prisma.TransactionClient,
  id: string,
  input: PaymentUpdateData,
): Promise<Payment> {
  const row = await tx.payment.update({
    where: { id },
    data: {
      ...(input.razorpayOrderId !== undefined ? { razorpayOrderId: input.razorpayOrderId } : {}),
      ...(input.razorpayPaymentId !== undefined ? { razorpayPaymentId: input.razorpayPaymentId } : {}),
      ...(input.razorpaySignature !== undefined ? { razorpaySignature: input.razorpaySignature } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.method !== undefined ? { method: input.method } : {}),
      ...(input.errorCode !== undefined ? { errorCode: input.errorCode } : {}),
      ...(input.errorDesc !== undefined ? { errorDesc: input.errorDesc } : {}),
    },
  });
  return toPayment(row);
}

export async function prismaMarkPaymentSuccessIfPending(
  tx: Prisma.TransactionClient,
  paymentId: string,
  input: {
    razorpayPaymentId: string;
    razorpaySignature: string | null;
  },
): Promise<boolean> {
  const result = await tx.payment.updateMany({
    where: {
      id: paymentId,
      status: 'PENDING',
    },
    data: {
      status: 'SUCCESS',
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    },
  });
  return result.count === 1;
}
