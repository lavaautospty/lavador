import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Gift, 
  Car, 
  TrendingUp,
  Award,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Fidelidad() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [comercio, setComercio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [recompensas, setRecompensas] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: comercioData } = await supabase
        .from('comercios')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (comercioData) {
        setComercio(comercioData);
        
        const [clientesRes, recompensasRes] = await Promise.all([
          supabase.from('clientes').select('*').eq('comercio_id', comercioData.id).order('lavadas_acumuladas', { ascending: false }),
          supabase.from('recompensas_fidelidad').select('*').eq('comercio_id', comercioData.id).order('lavadas_requeridas', { ascending: true })
        ]);

        setClientes(clientesRes.data || []);
        setRecompensas(recompensasRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNextReward = (lavadas: number) => {
    return recompensas.find(r => r.lavadas_requeridas > lavadas) || recompensas[recompensas.length - 1];
  };

  const getAvailableRewards = (lavadas: number) => {
    return recompensas.filter(r => r.lavadas_requeridas <= lavadas);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Programa de Fidelidad</h2>
        <p className="text-zinc-500 mt-1">Monitorea el progreso de tus clientes y premia su lealtad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Niveles de Premios</p>
              <h3 className="text-2xl font-bold text-zinc-900">{recompensas.length} Niveles</h3>
            </div>
          </div>
          <p className="text-xs text-zinc-500">Configura diferentes premios según las lavadas acumuladas.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Próximo Gran Premio</p>
              <h3 className="text-2xl font-bold text-zinc-900">
                {recompensas[recompensas.length - 1]?.premio_nombre || 'Sin premios'}
              </h3>
            </div>
          </div>
          <p className="text-xs text-zinc-500">El premio máximo disponible en tu programa.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Puntos Totales</p>
              <h3 className="text-2xl font-bold text-zinc-900">
                {clientes.reduce((acc, c) => acc + c.lavadas_acumuladas, 0)}
              </h3>
            </div>
          </div>
          <p className="text-xs text-zinc-500">Total de lavadas acumuladas por todos tus clientes.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente o placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Progreso</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => {
                  const nextReward = getNextReward(cliente.lavadas_acumuladas);
                  const availableRewards = getAvailableRewards(cliente.lavadas_acumuladas);
                  const progress = nextReward 
                    ? Math.min((cliente.lavadas_acumuladas / nextReward.lavadas_requeridas) * 100, 100)
                    : 100;

                  return (
                    <tr key={cliente.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-zinc-900">{cliente.nombre}</div>
                        <div className="text-xs text-zinc-500">{cliente.telefono || 'Sin teléfono'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                           <Car className="w-4 h-4 text-zinc-400" />
                           {cliente.placa}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[200px] space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                            <span>{cliente.lavadas_acumuladas} / {nextReward?.lavadas_requeridas || '-'}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                progress >= 100 ? "bg-emerald-500" : "bg-zinc-900"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 italic">
                            Próximo: {nextReward?.premio_nombre || 'Completado'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {availableRewards.length > 0 ? (
                            <>
                              {availableRewards.map((r, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                                  <Gift className="w-2.5 h-2.5" />
                                  {r.premio_nombre}
                                </span>
                              ))}
                              <Link 
                                to={`/lavados?cliente_id=${cliente.id}&canjear=true`}
                                className="ml-2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Ir a canjear"
                              >
                                <Plus className="w-4 h-4" />
                              </Link>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 uppercase">
                              En progreso
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
