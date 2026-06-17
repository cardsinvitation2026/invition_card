export interface RazorpayCreateOrderParams {
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayCreateOrderResult {
  id: string;
  amount: number;
  currency: string;
}
