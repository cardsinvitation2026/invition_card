import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PaymentRepository } from './payment.repository';
import type {
  Payment,
  PaymentCreateData,
  PaymentStatus,
  PaymentUpdateData,
} from '@/types/payment';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_payments__: Map<string, Payment> | undefined;
}

function store(): Map<string, Payment> {
  if (!globalThis.__mi_inmem_payments__) {
    globalThis.__mi_inmem_payments__ = new Map();
  }
  return globalThis.__mi_inmem_payments__;
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

export const inMemoryPaymentRepository: PaymentRepository = {
  async findById(id) {
    return store().get(id) ?? null;
  },

  async findByOrderId(orderId) {
    return [...store().values()].find((p) => p.orderId === orderId) ?? null;
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    return (
      [...store().values()].find((p) => p.razorpayPaymentId === razorpayPaymentId) ?? null
    );
  },

  async create(input: PaymentCreateData) {
    const now = new Date().toISOString();
    const created: Payment = {
      id: randomUUID(),
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
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    return created;
  },

  async update(id, input: PaymentUpdateData) {
    const existing = store().get(id);
    if (!existing) {
      throw new Error('Payment not found');
    }
    const updated: Payment = {
      ...existing,
      ...(input.razorpayOrderId !== undefined ? { razorpayOrderId: input.razorpayOrderId } : {}),
      ...(input.razorpayPaymentId !== undefined ? { razorpayPaymentId: input.razorpayPaymentId } : {}),
      ...(input.razorpaySignature !== undefined ? { razorpaySignature: input.razorpaySignature } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.method !== undefined ? { method: input.method } : {}),
      ...(input.errorCode !== undefined ? { errorCode: input.errorCode } : {}),
      ...(input.errorDesc !== undefined ? { errorDesc: input.errorDesc } : {}),
      updatedAt: new Date().toISOString(),
    };
    store().set(id, updated);
    return updated;
  },

  async listByOrder(orderId) {
    return [...store().values()]
      .filter((p) => p.orderId === orderId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
