export interface Sale {
  id?: number;
  date: string; // ISO format YYYY-MM-DD
  timestamp: number; // For exact sorting
  product: string;
  amount: number;
  paymentType: string;
  category?: string; // For future extensibility
  code?: string; // For future extensibility
}
