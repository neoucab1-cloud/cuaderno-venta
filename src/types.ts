export interface Sale {
  id?: number;
  date: string; // ISO format YYYY-MM-DD
  timestamp: number; // For exact sorting
  product: string;
  name?: string;
  amount: number;
  price?: number;
  quantity?: number;
  unit?: string;
  customer?: string;
  notes?: string;
  paymentType: string;
  category?: string; // For future extensibility
  code?: string; // For future extensibility
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  fields?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
}
