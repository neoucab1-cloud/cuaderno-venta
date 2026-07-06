import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Receipt, Trash2, Pencil, Check, X } from 'lucide-react';

interface SalesListProps {
  date: string;
  exchangeRate: number;
}

export function SalesList({ date, exchangeRate }: SalesListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const sales = useLiveQuery(
    () => db.sales.where('date').equals(date).reverse().sortBy('timestamp'),
    [date]
  );

  const total = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
  const totalBs = sales?.reduce((acc, sale) => acc + sale.amount * exchangeRate, 0) || 0;

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
      await db.sales.delete(id);
    }
  };

  const startEdit = (sale: { id?: number; product: string }) => {
    setEditingId(sale.id ?? null);
    setEditingValue(sale.product);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const nextValue = editingValue.trim();
    if (!nextValue) return;

    await db.sales.update(editingId, { product: nextValue, name: nextValue });
    cancelEdit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[600px] xl:max-h-[calc(100vh-280px)]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="font-bold text-slate-700">Ventas del Día</h2>
          <p className="text-xs text-slate-500 capitalize">
            {format(new Date(date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Hoy</p>
          <p className="text-lg font-bold text-blue-600 font-mono">${total.toFixed(2)}</p>
          <p className="text-xs font-medium text-emerald-600">Bs {totalBs.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sales === undefined ? (
          <p className="text-slate-500 text-center py-8">Cargando...</p>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay ventas registradas este día.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {sales.map((sale) => (
              <li key={sale.id} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors group gap-4">
                <div className="flex-1 min-w-0">
                  {editingId === sale.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={saveEdit} className="rounded-lg bg-emerald-600 p-2 text-white" title="Guardar">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="rounded-lg border border-slate-200 p-2 text-slate-500" title="Cancelar">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-800">{sale.name ?? sale.product}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{format(sale.timestamp, 'HH:mm')}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">{sale.paymentType}</span>
                        {typeof sale.quantity === 'number' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md">
                            {sale.quantity.toFixed(sale.quantity % 1 === 0 ? 0 : 2)} {sale.unit ?? 'unidad'}
                          </span>
                        )}
                      </div>
                      {sale.customer && <p className="mt-1 text-xs text-slate-600">Cliente: {sale.customer}</p>}
                      {sale.notes && <p className="mt-1 text-xs text-slate-500">Nota: {sale.notes}</p>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-slate-800">${sale.amount.toFixed(2)}</p>
                    <p className="text-xs font-medium text-slate-500">Precio/unidad: ${(sale.price ?? sale.amount).toFixed(2)}</p>
                    <p className="text-xs font-medium text-emerald-600">Bs {(sale.amount * exchangeRate).toFixed(2)}</p>
                  </div>
                  {editingId !== sale.id && (
                    <button
                      onClick={() => startEdit(sale)}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                      title="Editar producto"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
