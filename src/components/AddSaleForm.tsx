import { useEffect, useState, useRef, type FormEvent } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

interface AddSaleFormProps {
  exchangeRate: number;
}

const defaultUnits = ['unidad', 'kg', 'g', 'litro', 'ml', 'paquete', 'caja', 'pieza'];

function parseNumeric(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function AddSaleForm({ exchangeRate }: AddSaleFormProps) {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('unidad');
  const [unitPrice, setUnitPrice] = useState('');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('Efectivo');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [units, setUnits] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultUnits;
    const saved = window.localStorage.getItem('sale-units');
    if (!saved) return defaultUnits;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultUnits;
    } catch {
      return defaultUnits;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('sale-units', JSON.stringify(units));
  }, [units]);

  const recentProducts = useLiveQuery(
    async () => {
      if (!product) return [];
      const sales = await db.sales
        .where('product')
        .startsWithIgnoreCase(product)
        .reverse()
        .sortBy('timestamp');

      const uniqueProducts = new Map<string, { amount: number; price: number; unit: string }>();
      for (const sale of sales) {
        const key = sale.product.toLowerCase();
        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, {
            amount: sale.amount,
            price: sale.price ?? sale.amount,
            unit: sale.unit ?? 'unidad',
          });
        }
        if (uniqueProducts.size >= 5) break;
      }
      return Array.from(uniqueProducts.entries()).map(([name, data]) => ({ name, ...data }));
    },
    [product]
  );

  const productCatalogSuggestions = useLiveQuery(
    async () => {
      if (!product) return [];
      return db.products.where('name').startsWithIgnoreCase(product).limit(5).toArray();
    },
    [product]
  );

  const parsedQuantity = parseNumeric(quantity);
  const parsedUnitPrice = parseNumeric(unitPrice);
  const estimatedTotal = Number.isFinite(parsedQuantity) && Number.isFinite(parsedUnitPrice) && parsedQuantity > 0 && parsedUnitPrice >= 0
    ? parsedQuantity * parsedUnitPrice
    : null;
  const bolivarAmount = estimatedTotal === null ? null : estimatedTotal * exchangeRate;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const saleName = product.trim();
    const normalizedQuantity = parseNumeric(quantity);
    const normalizedUnitPrice = parseNumeric(unitPrice);

    if (!saleName || !Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0 || !Number.isFinite(normalizedUnitPrice) || normalizedUnitPrice < 0) {
      setStatusMessage('Ingresa cantidad y precio válidos para registrar la venta.');
      return;
    }

    try {
      const now = new Date();
      const totalAmount = Number((normalizedQuantity * normalizedUnitPrice).toFixed(2));
      const selectedUnit = unit.trim() || 'unidad';
      await db.sales.add({
        date: format(now, 'yyyy-MM-dd'),
        timestamp: now.getTime(),
        product: saleName,
        name: saleName,
        amount: totalAmount,
        price: Number(normalizedUnitPrice.toFixed(2)),
        quantity: Number(normalizedQuantity.toFixed(3)),
        unit: selectedUnit,
        customer: customer.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentType,
      });

      setProduct('');
      setQuantity('1');
      setUnit(units[0] ?? 'unidad');
      setUnitPrice('');
      setCustomer('');
      setNotes('');
      setPaymentType('Efectivo');
      setShowSuggestions(false);
      setStatusMessage('Venta registrada y guardada en la base de datos local.');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error adding sale:', error);
      setStatusMessage('No se pudo guardar la venta.');
    }
  };

  const handleSuggestionClick = (suggestionName: string, suggestionPrice: number, suggestionUnit: string) => {
    setProduct(suggestionName);
    setUnitPrice(suggestionPrice.toString());
    setUnit(suggestionUnit);
    setQuantity('1');
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 shrink-0 border-b border-slate-100">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-700">Nueva Venta</h2>
          <p className="text-xs text-slate-500">Registro rápido para el punto de venta.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Producto</label>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej. Coca Cola 2L"
                required
              />

              {showSuggestions && (productCatalogSuggestions?.length || recentProducts?.length) ? (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                  {productCatalogSuggestions?.length ? (
                    <div className="border-b border-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Catálogo</div>
                      {productCatalogSuggestions.map((productItem, idx) => (
                        <div
                          key={`catalog-${idx}`}
                          className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                          onClick={() => handleSuggestionClick(productItem.name, productItem.price, String(productItem.fields?.unit ?? 'unidad'))}
                        >
                          <span className="text-sm text-slate-600">{productItem.name}</span>
                          <span className="text-xs text-slate-400 font-mono">${productItem.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {recentProducts?.length ? (
                    <div>
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Ventas recientes</div>
                      {recentProducts.map((suggestion, idx) => (
                        <div
                          key={`recent-${idx}`}
                          className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                          onClick={() => handleSuggestionClick(suggestion.name, suggestion.price, suggestion.unit)}
                        >
                          <span className="text-sm text-slate-600">{suggestion.name}</span>
                          <span className="text-xs text-slate-400 font-mono">${suggestion.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cantidad</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Unidad</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {units.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Precio USD</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-slate-500 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tipo de Pago</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cliente</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Observación</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Referencia, pedido..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Total</p>
                <p className="text-lg font-bold text-emerald-700 font-mono">${estimatedTotal === null ? '0.00' : estimatedTotal.toFixed(2)}</p>
              </div>
              <p className="text-sm font-medium text-emerald-600">Bs {bolivarAmount === null ? '0.00' : bolivarAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{statusMessage || 'Revisa el total antes de confirmar.'}</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Registrar Venta
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
