import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

export function AddSaleForm() {
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState('Efectivo');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch unique products for suggestions
  const recentProducts = useLiveQuery(
    async () => {
      if (!product) return [];
      const sales = await db.sales
        .where('product')
        .startsWithIgnoreCase(product)
        .reverse()
        .sortBy('timestamp');
      
      // Get unique products with their latest amount
      const uniqueProducts = new Map<string, number>();
      for (const sale of sales) {
        if (!uniqueProducts.has(sale.product.toLowerCase())) {
          uniqueProducts.set(sale.product, sale.amount);
        }
        if (uniqueProducts.size >= 5) break; // Limit to 5 suggestions
      }
      return Array.from(uniqueProducts.entries()).map(([name, amt]) => ({ name, amount: amt }));
    },
    [product]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !amount) return;

    try {
      const now = new Date();
      await db.sales.add({
        date: format(now, 'yyyy-MM-dd'),
        timestamp: now.getTime(),
        product: product.trim(),
        amount: Number(amount),
        paymentType,
      });

      // Reset form
      setProduct('');
      setAmount('');
      setPaymentType('Efectivo');
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const handleSuggestionClick = (suggestionName: string, suggestionAmount: number) => {
    setProduct(suggestionName);
    setAmount(suggestionAmount);
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
      <h2 className="font-bold text-slate-700 mb-4">Nueva Venta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="relative">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Producto</label>
          <input
            ref={inputRef}
            type="text"
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ej. Coca Cola 2L"
            required
          />
          
          {showSuggestions && recentProducts && recentProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
              {recentProducts.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                  onClick={() => handleSuggestionClick(suggestion.name, suggestion.amount)}
                >
                  <span className="text-sm text-slate-600">{suggestion.name}</span>
                  <span className="text-xs text-slate-400 font-mono">${suggestion.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg font-mono text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tipo de Pago</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Registrar Venta
        </button>
      </form>
    </div>
  );
}
