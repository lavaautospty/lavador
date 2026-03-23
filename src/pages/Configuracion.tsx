import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Settings, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Info,
  MessageSquare,
  Building2,
  Phone,
  MapPin,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function Configuracion() {
  const [comercio, setComercio] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    logo_url: '',
    logo_width: '48',
    logo_height: '48',
    fidelidad_meta: 10,
    security_pin: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [newRecompensa, setNewRecompensa] = useState({ lavadas_requeridas: 5, premio_nombre: '' });

  const [paymentAmount, setPaymentAmount] = useState('24.99');
  const [paymentMethod, setPaymentMethod] = useState('Yappy');

  useEffect(() => {
    fetchComercio();
  }, []);

  async function fetchComercio() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('comercios')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (data) {
        setComercio(data);
        setFormData({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          whatsapp: data.whatsapp || '',
          direccion: data.direccion || '',
          logo_url: data.logo_url || '',
          logo_width: data.logo_width || '48',
          logo_height: data.logo_height || '48',
          fidelidad_meta: data.fidelidad_meta || 10,
          security_pin: data.security_pin || '',
        });
        fetchRecompensas(data.id);
        
        // Si no hay PIN, autorizar automáticamente. Si hay PIN, pedirlo.
        if (!data.security_pin) {
          setIsAuthorized(true);
        } else {
          setShowPasswordModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching commerce:', error);
    }
  }

  async function fetchRecompensas(comercioId: string) {
    const { data } = await supabase
      .from('recompensas_fidelidad')
      .select('*')
      .eq('comercio_id', comercioId)
      .order('lavadas_requeridas', { ascending: true });
    setRecompensas(data || []);
  }

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === comercio?.security_pin) {
      setIsAuthorized(true);
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('PIN incorrecto. Acceso denegado.');
    }
  };

  const handleAddRecompensa = async () => {
    if (!comercio || !newRecompensa.premio_nombre) return;
    try {
      const { error } = await supabase
        .from('recompensas_fidelidad')
        .insert({
          comercio_id: comercio.id,
          lavadas_requeridas: newRecompensa.lavadas_requeridas,
          premio_nombre: newRecompensa.premio_nombre
        });
      if (error) throw error;
      setNewRecompensa({ lavadas_requeridas: 5, premio_nombre: '' });
      fetchRecompensas(comercio.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteRecompensa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recompensas_fidelidad')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRecompensas(comercio.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSave = async () => {
    if (!comercio) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('comercios')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
          whatsapp: formData.whatsapp,
          direccion: formData.direccion,
          logo_url: formData.logo_url,
          fidelidad_meta: formData.fidelidad_meta,
          security_pin: formData.security_pin
        })
        .eq('id', comercio.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppSend = () => {
    const phone = '50760275561';
    const activationLink = `${window.location.origin}/admin/activar?id=${comercio?.id}`;
    const message = encodeURIComponent(
      `*RENOVACIÓN DE MEMBRESÍA - FullShell*\n\n` +
      `Hola, envío mi confirmación de pago para la renovación de mi membresía.\n\n` +
      `*Comercio:* ${comercio?.nombre || 'No especificado'}\n` +
      `*ID:* ${comercio?.id || 'N/A'}\n` +
      `*Monto:* $${paymentAmount}\n` +
      `*Método:* ${paymentMethod}\n\n` +
      `_Por favor, adjunte la captura de pantalla de su comprobante a continuación._\n\n` +
      `Enlace de activación para administrador:\n${activationLink}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (!isAuthorized && comercio?.security_pin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center">
          <Settings className="w-10 h-10 text-zinc-900" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900">Acceso Restringido</h2>
          <p className="text-zinc-500">Ingresa tu PIN para gestionar la configuración.</p>
        </div>
        <form onSubmit={handleVerifyPassword} className="w-full max-w-xs space-y-4">
          <input 
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-white border border-zinc-200 rounded-2xl text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
            placeholder="****"
          />
          <button 
            type="submit"
            className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-95"
          >
            Verificar PIN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Configuración</h2>
          <p className="text-zinc-500 mt-1">Personaliza el funcionamiento de tu autolavado.</p>
        </div>
        <div className="flex items-center gap-4">
          {message && (
            <div className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              {message.text}
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Perfil del Comercio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-lg font-bold text-zinc-900">Perfil del Comercio</h3>
          <p className="text-sm text-zinc-500 mt-1">Información básica que aparecerá en tus recibos y perfil.</p>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Negocio</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL del Logo</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="https://ejemplo.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              {formData.logo_url && (
                <div className="mt-4 p-4 border border-zinc-100 rounded-xl bg-zinc-50 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 flex items-center justify-center border border-zinc-200 rounded-lg bg-white overflow-hidden">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo preview" 
                        style={{ width: `${formData.logo_width}px`, height: `${formData.logo_height}px` }}
                        className="object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Ancho (px)</label>
                        <input 
                          type="number" 
                          value={formData.logo_width}
                          onChange={(e) => setFormData({...formData, logo_width: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Alto (px)</label>
                        <input 
                          type="number" 
                          value={formData.logo_height}
                          onChange={(e) => setFormData({...formData, logo_height: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Ajusta el tamaño del logo para que se vea bien en el recibo impreso.</p>
                </div>
              )}
            </div>

            <div className="space-y-1 pt-4 border-t border-zinc-100">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                PIN de Seguridad (para edición)
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Recomendado</span>
              </label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="password" 
                  placeholder="Ej: 1234"
                  value={formData.security_pin}
                  onChange={(e) => setFormData({...formData, security_pin: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                  maxLength={10}
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 italic">Este PIN se solicitará al intentar editar o eliminar servicios y empleados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan y Membresía */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-zinc-100">
        <div className="md:col-span-1">
          <h3 className="text-lg font-bold text-zinc-900">Plan y Membresía</h3>
          <p className="text-sm text-zinc-500 mt-1">Estado de tu suscripción y detalles del plan contratado.</p>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  comercio?.plan_status === 'active' ? "bg-emerald-500" : 
                  comercio?.plan_status === 'trial' ? "bg-blue-500" : "bg-amber-500"
                )} />
                <span className="font-bold text-zinc-900 uppercase tracking-wider text-sm">
                  {comercio?.plan_status === 'active' ? 'Plan Activo' : 
                   comercio?.plan_status === 'trial' ? 'Periodo de Prueba' : 'Plan Vencido'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vencimiento</p>
                <p className="text-sm font-bold text-zinc-900">
                  {comercio?.plan_expiration ? new Date(comercio?.plan_expiration).toLocaleDateString() : 
                   comercio?.trial_ends_at ? new Date(comercio?.trial_ends_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-sm text-zinc-600">
                Para renovar o cambiar tu plan, por favor contacta a soporte técnico. 
                Los pagos se realizan vía Yappy / CMF al <strong>6027-5561</strong> o Banco General (Ahorros 04-72-98-123456-7).
                Monto: <strong>$24.99</strong>
              </p>
              <a 
                href="https://wa.me/50760275561?text=Hola%2C%20quiero%20renovar%20mi%20membres%C3%ADa%20FullShell."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:underline"
              >
                <MessageSquare className="w-4 h-4" />
                Contactar Soporte por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Fidelidad Avanzado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-zinc-200">
        <div className="md:col-span-1">
          <h3 className="text-lg font-bold text-zinc-900">Sistema de Fidelidad</h3>
          <p className="text-sm text-zinc-500 mt-1">Configura múltiples niveles de recompensas para tus clientes.</p>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recompensas Configuradas</p>
              <div className="space-y-3">
                {recompensas.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">
                        {r.lavadas_requeridas}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{r.premio_nombre}</p>
                        <p className="text-xs text-zinc-500">Lavadas necesarias</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteRecompensa(r.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-2 border-dashed border-zinc-200 rounded-xl space-y-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Agregar Nueva Recompensa</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Lavadas</label>
                    <input 
                      type="number" 
                      value={newRecompensa.lavadas_requeridas}
                      onChange={(e) => setNewRecompensa({...newRecompensa, lavadas_requeridas: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Premio (ej: Pulido de Faros)</label>
                    <input 
                      type="text" 
                      placeholder="Nombre del premio..."
                      value={newRecompensa.premio_nombre}
                      onChange={(e) => setNewRecompensa({...newRecompensa, premio_nombre: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddRecompensa}
                  className="w-full py-2 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Agregar Recompensa
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">¿Cómo funciona?</p>
                Los clientes acumulan lavadas. Cuando alcanzan el número de lavadas de una recompensa, esta aparecerá como disponible en su perfil. Puedes configurar tantos niveles como desees (5, 10, 15, 20...).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
