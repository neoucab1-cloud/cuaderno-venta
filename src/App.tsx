import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Store, Download, Trash2, Calendar, LayoutDashboard } from 'lucide-react';
import { AddSaleForm } from './components/AddSaleForm';
import { SalesList } from './components/SalesList';
import { Dashboard } from './components/Dashboard';
import { db } from './db';

export default function App() {
  const [activeTab, setActiveTab] = useState<'registro' | 'estadisticas'>('registro');
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleExport = async () => {
    try {
      const allSales = await db.sales.toArray();
      const dataStr = JSON.stringify(allSales, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ventas_export_${today}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Hubo un error al exportar los datos.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex justify-center overflow-hidden">
      <div className="w-full max-w-6xl px-8 py-8 flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">LedgerPro / Caja Diaria</h1>
              <p className="text-xs text-slate-500 capitalize">{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Exportar datos a JSON (para futuras apps)"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar Datos</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit shrink-0">
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
            onClick={() => setActiveTab('estadisticas')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'estadisticas' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Estadísticas
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'registro' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-8">
              <div className="lg:col-span-4 h-fit">
                <AddSaleForm />
              </div>
              <div className="lg:col-span-8 h-full">
                <SalesList date={today} />
              </div>
            </div>
          ) : (
            <div className="pb-8">
              <Dashboard />
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
