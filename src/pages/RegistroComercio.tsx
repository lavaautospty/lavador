import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Store, Phone, MapPin, MessageSquare, CreditCard, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegistroComercio() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 10);

      const { error } = await supabase.from('comercios').insert({
        owner_id: user.id,
        ...formData,
        plan_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString()
      });

      if (error) throw error;
      window.location.href = '/';
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Configura tu Comercio</h2>
        <p className="text-zinc-500 mt-2">Completa los datos de tu autolavado para comenzar.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Comercio</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Mi Car Wash"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="tel" 
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="+507 6000-0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp (para facturas)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="tel" 
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="+507 6000-0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  required
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Calle 50, Ciudad de Panamá"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <h4 className="font-bold text-zinc-900 flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5" />
              Plan de Membresía
            </h4>
            <p className="text-sm text-zinc-500 mb-4">
              Comienzas con 10 días de prueba gratuita. Luego puedes activar tu plan enviando tu confirmación de pago por WhatsApp.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 bg-white border border-zinc-200 rounded-xl text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase">Trial</p>
                <p className="text-lg font-bold text-zinc-900">10 Días Gratis</p>
              </div>
              <div className="flex-1 p-4 bg-zinc-900 text-white rounded-xl text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase">Premium</p>
                <p className="text-lg font-bold">$29.99 / mes</p>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
