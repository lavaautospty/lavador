import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Car, 
  Gift, 
  X,
  Trash2,
  MoreVertical,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
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
    telefono: '',
    placa: ''
  });

  useEffect(() => {
    fetchComercioAndClientes();
  }, []);

  async function fetchComercioAndClientes() {
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
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('*')
          .eq('comercio_id', comercio.id)
          .order('nombre', { ascending: true });
        
        setClientes(clientesData || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioId) {
      alert('Error: No se encontró la configuración de tu comercio. Por favor, completa el registro.');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono,
            placa: formData.placa.toUpperCase()
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert({
          comercio_id: comercioId,
          nombre: formData.nombre,
          telefono: formData.telefono,
          placa: formData.placa.toUpperCase()
        });
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: '', telefono: '', placa: '' });
      fetchComercioAndClientes();
    } catch (error: any) {
      console.error('Error saving client:', error);
      alert('Error al guardar cliente: ' + (error.message || 'Error desconocido'));
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

  const performEdit = (cliente: any) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      placa: cliente.placa
    });
    setShowModal(true);
  };

  const performDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      fetchComercioAndClientes();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = (id: string) => {
    checkPasswordAndPerform('delete', id);
  };

  const handleEdit = (cliente: any) => {
    checkPasswordAndPerform('edit', undefined, cliente);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Clientes</h2>
          <p className="text-zinc-500 mt-1">Base de datos de clientes y fidelidad.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o placa..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900"></div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No hay clientes registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Lavadas</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                          {cliente.nombre[0].toUpperCase()}
                        </div>
                        <div className="text-sm font-bold text-zinc-900">{cliente.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {cliente.telefono || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-bold">
                        <Car className="w-3 h-3" />
                        {cliente.placa}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${Math.min((cliente.lavadas_acumuladas / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{cliente.lavadas_acumuladas}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(cliente)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">
                {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData({ nombre: '', telefono: '', placa: '' });
                }} 
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="tel" 
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="Ej: 6000-0000"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa del Vehículo</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 uppercase"
                    placeholder="Ej: AB1234"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors mt-4"
              >
                {editingId ? 'Actualizar Cliente' : 'Guardar Cliente'}
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
