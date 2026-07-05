import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Receipt, Trash2 } from 'lucide-react';

export function SalesList({ date }: { date: string }) {
  const sales = useLiveQuery(
    () => db.sales.where('date').equals(date).reverse().sortBy('timestamp'),
    [date]
  );

  const total = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
      await db.sales.delete(id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
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
              <li key={sale.id} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-slate-800">{sale.product}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{format(sale.timestamp, 'HH:mm')}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">{sale.paymentType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-slate-800">${sale.amount.toFixed(2)}</span>
                  <button 
                    onClick={() => handleDelete(sale.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
