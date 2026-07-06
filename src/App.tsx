import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Store, Download, Calendar, LayoutDashboard, Package, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AddSaleForm } from './components/AddSaleForm';
import { SalesList } from './components/SalesList';
import { Dashboard } from './components/Dashboard';
import { ProductManager } from './components/ProductManager';
import { db } from './db';

function parseNumeric(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'registro' | 'estadisticas' | 'productos'>('registro');
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = Number(localStorage.getItem('exchangeRate'));
    return Number.isFinite(saved) && saved > 0 ? Number(saved.toFixed(2)) : 50;
  });
  const today = format(new Date(), 'yyyy-MM-dd');

  const salesToday = useLiveQuery(
    () => db.sales.where('date').equals(today).toArray(),
    [today]
  );

  const dailySaleCount = salesToday?.length ?? 0;
  const dailyTotalUsd = salesToday?.reduce((acc, sale) => acc + sale.amount, 0) ?? 0;
  const dailyTotalBs = dailyTotalUsd * exchangeRate;

  const formatExchangeRate = (value: number) => Number(value.toFixed(2));

  useEffect(() => {
    localStorage.setItem('exchangeRate', formatExchangeRate(exchangeRate).toString());
  }, [exchangeRate]);

  const exportJson = async (data: unknown, filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const handleExport = async () => {
    try {
      const allSales = await db.sales.toArray();
      const allProducts = await db.products.toArray();
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        sales: allSales,
        products: allProducts,
      };
      await exportJson(exportPayload, `ventas_y_productos_${today}.json`);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Hubo un error al exportar los datos.');
    }
  };

  const handleExportSales = async () => {
    try {
      const allSales = await db.sales.toArray();
      await exportJson(allSales, `ventas_${today}.json`);
    } catch (error) {
      console.error('Error exportando ventas:', error);
      alert('Hubo un error al exportar las ventas.');
    }
  };

  const handleExportProducts = async () => {
    try {
      const allProducts = await db.products.toArray();
      await exportJson(allProducts, `productos_${today}.json`);
    } catch (error) {
      console.error('Error exportando productos:', error);
      alert('Hubo un error al exportar los productos.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col min-h-screen">

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">LedgerPro / Caja Diaria</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 capitalize">{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-[9.5rem] sm:min-w-[11rem]">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">Tasa USD/Bs</label>
              <input
                type="text"
                inputMode="decimal"
                value={exchangeRate === 0 ? '' : exchangeRate.toFixed(2)}
                onChange={(e) => {
                  const value = parseNumeric(e.target.value);
                  if (Number.isFinite(value) && value >= 0) {
                    setExchangeRate(formatExchangeRate(value));
                  } else if (e.target.value === '') {
                    setExchangeRate(0);
                  }
                }}
                onBlur={(e) => {
                  const value = parseNumeric(e.target.value);
                  setExchangeRate(Number.isFinite(value) && value > 0 ? formatExchangeRate(value) : 0);
                }}
                className="w-20 sm:w-24 bg-transparent text-sm sm:text-sm font-semibold text-slate-700 outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end sm:justify-start">
              <button
                onClick={handleExportSales}
                className="flex items-center px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                title="Exportar historial de ventas"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ventas</span>
              </button>
              <button
                onClick={handleExportProducts}
                className="flex items-center px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                title="Exportar catálogo de productos"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Productos</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                title="Exportar ventas y productos juntos"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Todo</span>
              </button>
              <button
                type="button"
                onClick={() => window.close()}
                className="flex items-center px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap"
                title="Cerrar la aplicación"
              >
                <X className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-full shrink-0">
          <button
            onClick={() => setActiveTab('registro')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'registro' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Registro Diario
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'productos' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            Productos
          </button>
          <button
            onClick={() => setActiveTab('estadisticas')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'estadisticas' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Estadísticas
          </button>
        </div>

        {activeTab === 'registro' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Operaciones del día</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{dailySaleCount}</p>
              <p className="mt-1 text-sm text-slate-500">Ventas registradas hoy</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total USD</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">${dailyTotalUsd.toFixed(2)}</p>
              <p className="mt-1 text-sm text-slate-500">Ventas del día al contado</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Bs</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">Bs {dailyTotalBs.toFixed(2)}</p>
              <p className="mt-1 text-sm text-slate-500">Convertido según tasa</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {activeTab === 'registro' ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6 pb-8">
              <div>
                <AddSaleForm exchangeRate={exchangeRate} />
              </div>
              <div>
                <SalesList date={today} exchangeRate={exchangeRate} />
              </div>
            </div>
          ) : activeTab === 'productos' ? (
            <div className="pb-8 h-full">
              <ProductManager />
            </div>
          ) : (
            <div className="pb-8">
              <Dashboard exchangeRate={exchangeRate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
