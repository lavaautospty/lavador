import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Car, 
  User, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  Printer,
  X,
  CreditCard,
  DollarSign,
  UserCheck,
  Gift
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Lavados() {
  const [searchParams] = useSearchParams();
  const [lavados, setLavados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedLavado, setSelectedLavado] = useState<any>(null);
  const [comercio, setComercio] = useState<any>(null);
  const [viewType, setViewType] = useState<'diario' | 'semanal' | 'mensual'>('diario');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form options
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ nombre: '', telefono: '', placa: '' });

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    servicio_id: '',
    empleado_id: '',
    metodo_pago: 'efectivo',
    es_gratis: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const clienteId = searchParams.get('cliente_id');
    const canjear = searchParams.get('canjear');
    
    if (clienteId) {
      setFormData(prev => ({ ...prev, cliente_id: clienteId, es_gratis: canjear === 'true' }));
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (comercio) {
      fetchLavados();
    }
  }, [viewType, comercio]);

  async function fetchLavados() {
    if (!comercio) return;
    setLoading(true);
    try {
      let query = supabase
        .from('lavados')
        .select('*, cliente:clientes(*), servicio:servicios(*), empleado:empleados(*)')
        .eq('comercio_id', comercio.id)
        .order('created_at', { ascending: false });

      const now = new Date();
      if (viewType === 'diario') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte('created_at', startOfDay);
      } else if (viewType === 'semanal') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
        query = query.gte('created_at', startOfWeek);
      } else if (viewType === 'mensual') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('created_at', startOfMonth);
      }

      const { data } = await query;
      setLavados(data || []);
    } catch (error) {
      console.error('Error fetching lavados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInitialData() {
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
        
        // Fetch static data in parallel
        const [clientesRes, serviciosRes, empleadosRes, recompensasRes] = await Promise.all([
          supabase.from('clientes').select('*').eq('comercio_id', comercioData.id).order('nombre'),
          supabase.from('servicios').select('*').eq('comercio_id', comercioData.id).order('nombre'),
          supabase.from('empleados').select('*').eq('comercio_id', comercioData.id).order('nombre'),
          supabase.from('recompensas_fidelidad').select('*').eq('comercio_id', comercioData.id).order('lavadas_requeridas', { ascending: true })
        ]);

        setClientes(clientesRes.data || []);
        setServicios(serviciosRes.data || []);
        setEmpleados(empleadosRes.data || []);
        setRecompensas(recompensasRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercio) {
      alert('Error: No se encontró la configuración de tu comercio. Por favor, completa el registro.');
      return;
    }

    const selectedServicio = servicios.find(s => s.id === formData.servicio_id);
    if (!selectedServicio) {
      alert('Por favor selecciona un servicio válido.');
      return;
    }

    try {
      const selectedEmpleado = empleados.find(e => e.id === formData.empleado_id);
      let comision = 0;

      if (selectedEmpleado && !formData.es_gratis) {
        if (selectedEmpleado.tipo_pago === 'porcentaje') {
          comision = (selectedServicio.precio * selectedEmpleado.monto_pago) / 100;
        } else if (selectedEmpleado.tipo_pago === 'por_lavado') {
          comision = selectedEmpleado.monto_pago;
        }
      }

      const { data: lavado, error: lavadoError } = await supabase.from('lavados').insert({
        comercio_id: comercio.id,
        cliente_id: formData.cliente_id || null,
        servicio_id: formData.servicio_id,
        empleado_id: formData.empleado_id || null,
        monto_total: formData.es_gratis ? 0 : selectedServicio.precio,
        metodo_pago: formData.es_gratis ? 'gratis' : formData.metodo_pago,
        es_gratis: formData.es_gratis,
        comision_empleado: comision
      }).select().single();

      if (lavadoError) throw lavadoError;
      
      // Update client loyalty if applicable
      if (formData.cliente_id) {
        const cliente = clientes.find(c => c.id === formData.cliente_id);
        if (cliente) {
          let newLavadas = cliente.lavadas_acumuladas;
          
          if (formData.es_gratis && selectedReward) {
            newLavadas = Math.max(0, newLavadas - selectedReward.lavadas_requeridas);
          } else if (!formData.es_gratis && selectedServicio.suma_puntos) {
            newLavadas += 1;
          }

          await supabase.from('clientes').update({ lavadas_acumuladas: newLavadas }).eq('id', cliente.id);
        }
      }

      const { data: fullLavado } = await supabase
        .from('lavados')
        .select('*, cliente:clientes(*), servicio:servicios(*), empleado:empleados(*)')
        .eq('id', lavado.id)
        .single();
      
      setShowModal(false);
      setFormData({ cliente_id: '', servicio_id: '', empleado_id: '', metodo_pago: 'efectivo', es_gratis: false });
      setSelectedReward(null);
      fetchInitialData();
      
      // Open invoice preview automatically
      if (fullLavado) {
        setSelectedLavado(fullLavado);
        setShowInvoiceModal(true);
      }
    } catch (error: any) {
      console.error('Error saving wash:', error);
      alert('Error al registrar lavado: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercio) return;
    try {
      const { data, error } = await supabase.from('clientes').insert({
        comercio_id: comercio.id,
        nombre: newClientData.nombre,
        telefono: newClientData.telefono,
        placa: newClientData.placa.toUpperCase()
      }).select().single();

      if (error) throw error;
      
      setClientes([...clientes, data]);
      setFormData({ ...formData, cliente_id: data.id });
      setShowNewClientModal(false);
      setNewClientData({ nombre: '', telefono: '', placa: '' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleWhatsAppInvoice = (lavado: any) => {
    const puntosActuales = lavado.cliente?.lavadas_acumuladas || 0;
    
    // Find next reward
    const proximaRecompensa = recompensas
      .filter(r => r.lavadas_requeridas > puntosActuales)
      .sort((a, b) => a.lavadas_requeridas - b.lavadas_requeridas)[0];

    const messageText = 
      `*${comercio?.nombre?.toUpperCase() || 'FULLSHELL'}*\n` +
      (comercio?.direccion ? `📍 ${comercio.direccion}\n` : '') +
      (comercio?.telefono ? `📞 Tel: ${comercio.telefono}\n` : '') +
      `----------------------------\n` +
      `*RECIBO DE SERVICIO*\n` +
      `Factura: #${lavado.id.slice(0, 8)}\n` +
      `Fecha: ${format(new Date(lavado.created_at), 'dd/MM/yy HH:mm')}\n` +
      `----------------------------\n` +
      `*CLIENTE:* ${lavado.cliente?.nombre || 'General'}\n` +
      `*PLACA:* ${lavado.cliente?.placa || 'N/A'}\n` +
      `*SERVICIO:* ${lavado.servicio?.nombre}\n` +
      `*PAGO:* ${lavado.metodo_pago.toUpperCase()}\n` +
      `*TOTAL: USD ${lavado.monto_total.toFixed(2)}*\n` +
      `----------------------------\n` +
      `*FIDELIDAD*\n` +
      `Puntos: ${puntosActuales}\n` +
      (proximaRecompensa ? `Próximo: ${proximaRecompensa.premio_nombre} (${proximaRecompensa.lavadas_requeridas} pts)\n` : '') +
      `----------------------------\n` +
      `¡Gracias por su visita! 🚗✨`;
    
    const encodedMessage = encodeURIComponent(messageText);
    const phoneNumber = lavado.cliente?.telefono ? lavado.cliente.telefono.replace(/\D/g, '') : '';
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const openInvoicePreview = (lavado: any) => {
    setSelectedLavado(lavado);
    setShowInvoiceModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Lavados</h2>
          <p className="text-zinc-500 mt-1">Gestiona los servicios realizados hoy.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Lavado
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('diario')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                viewType === 'diario' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Diario
            </button>
            <button 
              onClick={() => setViewType('semanal')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                viewType === 'semanal' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Semanal
            </button>
            <button 
              onClick={() => setViewType('mensual')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                viewType === 'mensual' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Mensual
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente / Placa</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900 mx-auto"></div>
                  </td>
                </tr>
              ) : lavados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No hay lavados registrados {viewType === 'diario' ? 'hoy' : viewType === 'semanal' ? 'esta semana' : 'este mes'}.
                  </td>
                </tr>
              ) : (
                lavados
                  .filter(l => 
                    l.cliente?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((lavado) => (
                  <tr key={lavado.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-900">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        {format(new Date(lavado.created_at), 'HH:mm', { locale: es })}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {format(new Date(lavado.created_at), 'dd MMM', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-900">{lavado.cliente?.nombre || 'General'}</div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                        <Car className="w-3 h-3" />
                        {lavado.cliente?.placa || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900">{lavado.servicio?.nombre}</div>
                      {lavado.es_gratis && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase mt-1">
                          Premio
                        </span>
                      )}
                      {!lavado.es_gratis && lavado.servicio?.suma_puntos && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase mt-1 ml-1">
                          +1 Punto
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {lavado.empleado?.nombre || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-900">
                        {formatCurrency(lavado.monto_total)}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">
                        {lavado.metodo_pago}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Completado
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openInvoicePreview(lavado)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Ver Factura / Enviar"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Nuevo Lavado</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente</label>
                    <button 
                      type="button"
                      onClick={() => setShowNewClientModal(true)}
                      className="text-[10px] font-bold text-zinc-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Nuevo Cliente
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="text"
                        placeholder="Filtrar clientes..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <select 
                        value={formData.cliente_id}
                        onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                      >
                        <option value="">Cliente General</option>
                        {clientes
                          .filter(c => 
                            c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || 
                            c.placa.toLowerCase().includes(clientSearch.toLowerCase())
                          )
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.placa}) - {c.lavadas_acumuladas}/{comercio?.fidelidad_meta || 10} pts
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Servicio</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select 
                      required
                      value={formData.servicio_id}
                      onChange={(e) => setFormData({...formData, servicio_id: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                    >
                      <option value="">Seleccionar Servicio</option>
                      {servicios.map(s => (
                        <option key={s.id} value={s.id} disabled={formData.es_gratis && !s.es_premio}>
                          {s.nombre} - {formatCurrency(s.precio)} 
                          {s.es_premio ? ' (🎁 Premio)' : ''}
                          {!s.suma_puntos ? ' (🚫 No suma)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Empleado</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select 
                      value={formData.empleado_id}
                      onChange={(e) => setFormData({...formData, empleado_id: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                    >
                      <option value="">Sin asignar</option>
                      {empleados.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Método de Pago</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select 
                      disabled={formData.es_gratis}
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none disabled:opacity-50"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="yappy">Yappy</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="es_gratis"
                    checked={formData.es_gratis}
                    onChange={(e) => {
                      setFormData({...formData, es_gratis: e.target.checked});
                      if (!e.target.checked) setSelectedReward(null);
                    }}
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="es_gratis" className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Canjear Premio de Fidelidad
                  </label>
                </div>

                {formData.es_gratis && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Premios Disponibles para este Cliente</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const cliente = clientes.find(c => c.id === formData.cliente_id);
                        if (!cliente) return <p className="text-xs text-emerald-600 italic">Selecciona un cliente para ver sus premios.</p>;
                        
                        const available = recompensas.filter(r => r.lavadas_requeridas <= cliente.lavadas_acumuladas);
                        if (available.length === 0) return <p className="text-xs text-emerald-600 italic">El cliente no tiene lavadas suficientes para premios.</p>;

                        return available.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedReward(r)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              selectedReward?.id === r.id 
                                ? "bg-emerald-600 text-white shadow-sm" 
                                : "bg-white border border-emerald-200 text-emerald-700 hover:border-emerald-400"
                            )}
                          >
                            {r.premio_nombre} ({r.lavadas_requeridas} pts)
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total a Cobrar</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {formData.es_gratis ? formatCurrency(0) : formatCurrency(servicios.find(s => s.id === formData.servicio_id)?.precio || 0)}
                  </p>
                </div>
                <button 
                  type="submit"
                  className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Registrar Lavado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Factura / Preview */}
      {showInvoiceModal && selectedLavado && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden"
          onClick={() => setShowInvoiceModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Vista Previa de Recibo</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 bg-zinc-50">
              <div id="printable-invoice" className="bg-white p-6 shadow-sm border border-zinc-100 rounded-sm font-mono text-[10px] leading-tight text-zinc-900 mx-auto w-[280px]">
                <div className="text-center space-y-1 mb-4">
                  {comercio?.logo_url && (
                    <img 
                      src={comercio.logo_url} 
                      alt="Logo" 
                      style={{ 
                        width: `${comercio.logo_width || 48}px`, 
                        height: `${comercio.logo_height || 48}px` 
                      }}
                      className="mx-auto mb-2 object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <p className="font-bold text-xs uppercase">{comercio?.nombre || 'FullShell'}</p>
                  <p>{comercio?.direccion || ''}</p>
                  <p>Tel: {comercio?.telefono || ''}</p>
                </div>
                
                <div className="border-t border-dashed border-zinc-300 pt-2 mb-2">
                  <p className="font-bold text-center mb-2">RECIBO DE SERVICIO</p>
                  <div className="flex justify-between">
                    <span>Factura:</span>
                    <span>#{selectedLavado.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{format(new Date(selectedLavado.created_at), 'dd/MM/yy HH:mm')}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-2 mb-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-bold">{selectedLavado.cliente?.nombre || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Placa:</span>
                    <span className="font-bold">{selectedLavado.cliente?.placa || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-2 mb-2">
                  <div className="flex justify-between font-bold">
                    <span>Servicio:</span>
                    <span>{selectedLavado.servicio?.nombre}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-zinc-500">
                    <span>Método:</span>
                    <span className="uppercase">{selectedLavado.metodo_pago}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-2 mb-4 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase">Total:</span>
                  <span className="font-bold text-sm">{formatCurrency(selectedLavado.monto_total)}</span>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-2 mb-4 text-center space-y-1">
                  <p className="font-bold">PROGRAMA DE FIDELIDAD</p>
                  <p>Puntos: {selectedLavado.cliente?.lavadas_acumuladas || 0}</p>
                  {(() => {
                    const next = recompensas
                      .filter(r => r.lavadas_requeridas > (selectedLavado.cliente?.lavadas_acumuladas || 0))
                      .sort((a, b) => a.lavadas_requeridas - b.lavadas_requeridas)[0];
                    return next ? <p className="text-[8px]">Próximo: {next.premio_nombre} ({next.lavadas_requeridas} pts)</p> : null;
                  })()}
                </div>

                <div className="text-center italic text-[8px] mt-4">
                  ¡Gracias por su visita!
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-zinc-100 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
                </button>
                <button 
                  onClick={() => handleWhatsAppInvoice(selectedLavado)}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showNewClientModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowNewClientModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Registrar Nuevo Cliente</h3>
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={newClientData.nombre}
                  onChange={(e) => setNewClientData({...newClientData, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono</label>
                <input 
                  type="tel" 
                  value={newClientData.telefono}
                  onChange={(e) => setNewClientData({...newClientData, telefono: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="+507 6000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa</label>
                <input 
                  type="text" 
                  required
                  value={newClientData.placa}
                  onChange={(e) => setNewClientData({...newClientData, placa: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="ABC-123"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 mt-4"
              >
                Registrar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 5mm;
            box-shadow: none;
            border: none;
          }
        }
      `}} />
    </div>
  );
}
