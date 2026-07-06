import Dexie, { type EntityTable } from 'dexie';
import { Product, Sale } from './types';

export const db = new Dexie('VentasDatabase') as Dexie & {
  sales: EntityTable<Sale, 'id'>;
  products: EntityTable<Product, 'id'>;
};

// Schema declaration:
// ++id: auto-increment primary key
// date: index for filtering by day
// timestamp: index for sorting by exact time
// product: index for searching products
db.version(4).stores({
  sales: '++id, date, timestamp, product, customer, paymentType, quantity, unit',
  products: '++id, name, price, updatedAt'
});
