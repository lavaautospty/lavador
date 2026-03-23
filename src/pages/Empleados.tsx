import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  UserCheck, 
  DollarSign, 
  Clock, 
  X,
  Trash2,
  Briefcase,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function Empleados() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'edit' | 'delete', id?: string, data?: any} | null>(null);
  const [comercioId, setComercioId] = useState<string | null>(null);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_pago: 'por_lavado',
    monto_pago: ''
  });

  useEffect(() => {
    fetchComercioAndEmpleados();
  }, []);

  async function fetchComercioAndEmpleados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: comercio } = await supabase
        .from('comercios')
        .select('id, security_pin')
        .eq('owner_id', user.id)
        .single();

      if (comercio) {
        setComercioId(comercio.id);
        setSecurityPin(comercio.security_pin);
        const { data: empleadosData } = await supabase
          .from('empleados')
          .select('*')
          .eq('comercio_id', comercio.id)
          .order('nombre', { ascending: true });
        
        setEmpleados(empleadosData || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioId) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('empleados')
          .update({
            nombre: formData.nombre,
            tipo_pago: formData.tipo_pago,
            monto_pago: parseFloat(formData.monto_pago)
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('empleados').insert({
          comercio_id: comercioId,
          nombre: formData.nombre,
          tipo_pago: formData.tipo_pago,
          monto_pago: parseFloat(formData.monto_pago)
        });
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: '', tipo_pago: 'por_lavado', monto_pago: '' });
      fetchComercioAndEmpleados();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const checkPasswordAndPerform = (action: 'edit' | 'delete', id?: string, data?: any) => {
    if (!securityPin) {
      if (action === 'delete' && id) performDelete(id);
      if (action === 'edit' && data) performEdit(data);
      return;
    }
    setPendingAction({ type: action, id, data });
    setShowPasswordModal(true);
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === securityPin) {
      setShowPasswordModal(false);
      setPassword('');
      if (pendingAction?.type === 'delete' && pendingAction.id) {
        performDelete(pendingAction.id);
      } else if (pendingAction?.type === 'edit' && pendingAction.data) {
        performEdit(pendingAction.data);
      }
      setPendingAction(null);
    } else {
      alert('PIN incorrecto. Acceso denegado.');
    }
  };

  const performEdit = (empleado: any) => {
    setEditingId(empleado.id);
    setFormData({
      nombre: empleado.nombre,
      tipo_pago: empleado.tipo_pago,
      monto_pago: empleado.monto_pago.toString()
    });
    setShowModal(true);
  };

  const performDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    try {
      const { error } = await supabase.from('empleados').delete().eq('id', id);
      if (error) throw error;
      fetchComercioAndEmpleados();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = (id: string) => {
    checkPasswordAndPerform('delete', id);
  };

  const handleEdit = (empleado: any) => {
    checkPasswordAndPerform('edit', undefined, empleado);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Empleados</h2>
          <p className="text-zinc-500 mt-1">Gestión de personal y pagos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Empleado
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900"></div>
        </div>
      ) : empleados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">No hay empleados</h3>
          <p className="text-zinc-500 mt-1">Registra a tu equipo para asignar lavados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empleados.map((empleado) => (
            <div key={empleado.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-lg">
                    {empleado.nombre[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{empleado.nombre}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 uppercase">
                      {empleado.tipo_pago.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(empleado)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(empleado.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto de Pago</p>
                <div className="flex items-center gap-1 text-xl font-bold text-zinc-900">
                  {formatCurrency(empleado.monto_pago)}
                  <span className="text-xs font-medium text-zinc-500">
                    {empleado.tipo_pago === 'por_lavado' ? '/ lavado' : '/ periodo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">
                {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData({ nombre: '', tipo_pago: 'por_lavado', monto_pago: '' });
                }} 
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Ej: Carlos Martínez"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de Pago</label>
                <select 
                  value={formData.tipo_pago}
                  onChange={(e) => setFormData({...formData, tipo_pago: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                >
                  <option value="porcentaje">Porcentaje (%) por Lavado</option>
                  <option value="por_lavado">Monto Fijo por Lavado</option>
                  <option value="por_dia">Por Día</option>
                  <option value="por_hora">Por Hora</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {formData.tipo_pago === 'porcentaje' ? 'Porcentaje (%)' : 'Monto (USD)'}
                </label>
                <div className="relative">
                  {formData.tipo_pago !== 'porcentaje' ? (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  ) : (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400">%</span>
                  )}
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.monto_pago}
                    onChange={(e) => setFormData({...formData, monto_pago: e.target.value})}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder={formData.tipo_pago === 'porcentaje' ? "Ej: 15" : "0.00"}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors mt-4"
              >
                {editingId ? 'Actualizar Empleado' : 'Guardar Empleado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-zinc-900" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Seguridad</h3>
                <p className="text-xs text-zinc-500">Ingresa tu PIN para continuar</p>
              </div>
              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <input 
                  type="password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="****"
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword('');
                      setPendingAction(null);
                    }}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Verificar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
