import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subWeeks, subMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function Dashboard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  
  const dateRange = useMemo(() => {
    const today = new Date();
    if (period === 'week') {
      return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
    } else {
      return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [period]);

  const sales = useLiveQuery(
    () => db.sales
      .where('timestamp')
      .between(dateRange.start.getTime(), dateRange.end.getTime())
      .toArray(),
    [dateRange]
  );

  const chartData = useMemo(() => {
    if (!sales) return [];
    
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = sales.filter(s => s.date === dayStr);
      const total = daySales.reduce((sum, s) => sum + s.amount, 0);
      return {
        date: day,
        name: format(day, period === 'week' ? 'EEE' : 'd', { locale: es }),
        total,
        count: daySales.length
      };
    });
  }, [sales, dateRange, period]);

  const totalPeriod = chartData.reduce((sum, day) => sum + day.total, 0);
  const bestDay = [...chartData].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-slate-700">Estadísticas</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Total {period === 'week' ? 'Semanal' : 'Mensual'}</p>
          <p className="text-2xl font-bold font-mono text-blue-700">${totalPeriod.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mejor Día</p>
          <p className="text-2xl font-bold font-mono text-slate-800">{bestDay && bestDay.total > 0 ? `$${bestDay.total.toFixed(2)}` : '-'}</p>
          <p className="text-xs text-slate-500 capitalize mt-1 font-medium">
            {bestDay && bestDay.total > 0 ? format(bestDay.date, 'EEEE d', { locale: es }) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm">
                      <p className="font-medium mb-1 capitalize">{format(payload[0].payload.date, "EEEE, d 'de' MMMM", { locale: es })}</p>
                      <p className="text-gray-300">Ventas: <span className="font-semibold text-white">${payload[0].value?.toFixed(2)}</span></p>
                      <p className="text-gray-300 text-xs mt-1">Operaciones: {payload[0].payload.count}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
