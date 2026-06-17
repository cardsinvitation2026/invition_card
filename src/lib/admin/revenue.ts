import type { Order } from '@/types/order';
import type { Payment } from '@/types/payment';

export function sumSuccessfulPaymentAmounts(
  items: Array<{ status: string; amount: number }>,
): number {
  let total = 0;
  for (const item of items) {
    if (item.status === 'SUCCESS') {
      total += item.amount;
    }
  }
  return total;
}

export function buildLifetimeSpendByUser(
  orders: Order[],
  paymentsByOrderId: Map<string, Payment>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of orders) {
    const payment = paymentsByOrderId.get(order.id);
    if (payment?.status === 'SUCCESS') {
      map.set(order.userId, (map.get(order.userId) ?? 0) + payment.amount);
    }
  }
  return map;
}
