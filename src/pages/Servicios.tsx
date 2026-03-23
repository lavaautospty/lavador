import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  DollarSign, 
  Tag, 
  X,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function Servicios() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'edit' | 'delete', id?: string, data?: any} | null>(null);
  const [comercioId, setComercioId] = useState<string | null>(null);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo_insumos: '0',
    suma_puntos: true,
    es_premio: false
  });

  useEffect(() => {
    fetchComercioAndServicios();
  }, []);

  async function fetchComercioAndServicios() {
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
        const { data: serviciosData } = await supabase
          .from('servicios')
          .select('*')
          .eq('comercio_id', comercio.id)
          .order('created_at', { ascending: false });
        
        setServicios(serviciosData || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
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
          .from('servicios')
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            precio: parseFloat(formData.precio),
            costo_insumos: parseFloat(formData.costo_insumos),
            suma_puntos: formData.suma_puntos,
            es_premio: formData.es_premio
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('servicios').insert({
          comercio_id: comercioId,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: parseFloat(formData.precio),
          costo_insumos: parseFloat(formData.costo_insumos),
          suma_puntos: formData.suma_puntos,
          es_premio: formData.es_premio
        });
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ 
        nombre: '', 
        descripcion: '', 
        precio: '', 
        costo_insumos: '0',
        suma_puntos: true,
        es_premio: false
      });
      fetchComercioAndServicios();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert('Error al guardar servicio: ' + (error.message || 'Error desconocido'));
    }
  };

  const checkPasswordAndPerform = (action: 'edit' | 'delete' | 'create', id?: string, data?: any) => {
    if (!securityPin) {
      // Si no hay PIN configurado, permitir acción
      if (action === 'delete' && id) performDelete(id);
      if (action === 'edit' && data) performEdit(data);
      if (action === 'create') setShowModal(true);
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
      } else if (pendingAction?.type === 'create') {
        setShowModal(true);
      }
      setPendingAction(null);
    } else {
      alert('PIN incorrecto. Acceso denegado.');
    }
  };

  const performEdit = (servicio: any) => {
    setEditingId(servicio.id);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio: servicio.precio.toString(),
      costo_insumos: servicio.costo_insumos.toString(),
      suma_puntos: servicio.suma_puntos,
      es_premio: servicio.es_premio
    });
    setShowModal(true);
  };

  const performDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      const { error } = await supabase.from('servicios').delete().eq('id', id);
      if (error) throw error;
      fetchComercioAndServicios();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = (id: string) => {
    checkPasswordAndPerform('delete', id);
  };

  const handleEdit = (servicio: any) => {
    checkPasswordAndPerform('edit', undefined, servicio);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Servicios</h2>
          <p className="text-zinc-500 mt-1">Configura los precios y costos de tus servicios.</p>
        </div>
        <button 
          onClick={() => checkPasswordAndPerform('create')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900"></div>
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">No hay servicios</h3>
          <p className="text-zinc-500 mt-1">Comienza agregando los servicios que ofreces.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-6 text-sm font-bold text-zinc-900 hover:underline"
          >
            Agregar mi primer servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios
            .filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((servicio) => (
            <div key={servicio.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(servicio)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(servicio.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{servicio.nombre}</h3>
              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{servicio.descripcion || 'Sin descripción'}</p>
              
              <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Precio</p>
                  <p className="text-xl font-bold text-zinc-900">{formatCurrency(servicio.precio)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Costo Insumos</p>
                  <p className="text-sm font-medium text-red-600">{formatCurrency(servicio.costo_insumos)}</p>
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
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData({ nombre: '', descripcion: '', precio: '', costo_insumos: '0', suma_puntos: true, es_premio: false });
                }} 
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Ej: Lavado Completo"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción (Opcional)</label>
                <textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 resize-none h-24"
                  placeholder="Detalles del servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Precio</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: e.target.value})}
                      className="w-full pl-9 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Costo Insumos</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.costo_insumos}
                      onChange={(e) => setFormData({...formData, costo_insumos: e.target.value})}
                      className="w-full pl-9 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.suma_puntos}
                    onChange={(e) => setFormData({...formData, suma_puntos: e.target.checked})}
                    className="w-4 h-4 accent-zinc-900"
                  />
                  <span className="text-xs font-bold text-zinc-700">Suma Puntos</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.es_premio}
                    onChange={(e) => setFormData({...formData, es_premio: e.target.checked})}
                    className="w-4 h-4 accent-zinc-900"
                  />
                  <span className="text-xs font-bold text-zinc-700">Es Premio</span>
                </label>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors mt-4"
              >
                {editingId ? 'Actualizar Servicio' : 'Guardar Servicio'}
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
