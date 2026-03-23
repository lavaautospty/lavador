import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    totalWashes: 0,
    activeClients: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: comercio } = await supabase
          .from('comercios')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (comercio) {
          // Fetch real data
          const [lavadosRes, clientesRes] = await Promise.all([
            supabase.from('lavados').select('created_at, monto_total, comision_empleado, servicio:servicios(costo_insumos)').eq('comercio_id', comercio.id),
            supabase.from('clientes').select('id', { count: 'exact' }).eq('comercio_id', comercio.id)
          ]);

          const lavados = lavadosRes.data || [];
          const revenue = lavados.reduce((acc, l) => acc + (Number(l.monto_total) || 0), 0);
          
          const costs = lavados.reduce((acc, l) => {
            const comision = Number(l.comision_empleado) || 0;
            const insumos = Number((l.servicio as any)?.costo_insumos) || 0;
            return acc + comision + insumos;
          }, 0);

          setStats({
            totalRevenue: revenue,
            totalCosts: costs,
            totalWashes: lavados.length,
            activeClients: clientesRes.count || 0,
          });

          // Process chart data (last 7 days)
          const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
              name: days[d.getDay()],
              date: d.toISOString().split('T')[0],
              revenue: 0,
              costs: 0
            };
          });

          lavados.forEach(l => {
            const date = l.created_at.split('T')[0];
            const dayData = last7Days.find(d => d.date === date);
            if (dayData) {
              dayData.revenue += Number(l.monto_total) || 0;
              dayData.costs += (Number(l.comision_empleado) || 0) + (Number((l.servicio as any)?.costo_insumos) || 0);
            }
          });

          setChartData(last7Days);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { name: 'Lun', revenue: 400, costs: 240 },
    { name: 'Mar', revenue: 300, costs: 139 },
    { name: 'Mie', revenue: 200, costs: 980 },
    { name: 'Jue', revenue: 278, costs: 390 },
    { name: 'Vie', revenue: 189, costs: 480 },
    { name: 'Sab', revenue: 239, costs: 380 },
    { name: 'Dom', revenue: 349, costs: 430 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <h3 className="text-2xl font-bold text-zinc-900 mt-1">{value}</h3>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-1">Resumen general de tu autolavado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          trend={12.5}
          color="bg-zinc-900"
        />
        <StatCard 
          title="Costos Operativos" 
          value={formatCurrency(stats.totalCosts)} 
          icon={TrendingDown} 
          trend={-4.2}
          color="bg-red-600"
        />
        <StatCard 
          title="Lavados Realizados" 
          value={stats.totalWashes} 
          icon={Car} 
          trend={8.1}
          color="bg-blue-600"
        />
        <StatCard 
          title="Clientes Activos" 
          value={stats.activeClients} 
          icon={Users} 
          trend={15.3}
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Ingresos vs Costos (Semanal)</h3>
          <div className="h-[300px] w-full relative min-w-0">
            {mounted && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#18181b" radius={[4, 4, 0, 0]} name="Ingresos" />
                  <Bar dataKey="costs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Costos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Utilidad Neta</h3>
          <div className="h-[300px] w-full relative min-w-0">
            {mounted && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey={(d) => d.revenue - d.costs} 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorUtil)" 
                    name="Utilidad"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
