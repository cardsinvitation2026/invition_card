export type OrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  userId: string;
  membershipId: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
}

export interface OrderListResult {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface OrderCreateData {
  userId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  membershipId?: string | null;
}

export interface OrderUpdateData {
  status?: OrderStatus;
  membershipId?: string | null;
}

export interface CreateCheckoutOrderResult {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}
