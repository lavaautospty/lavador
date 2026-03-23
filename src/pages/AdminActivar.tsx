import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminActivar() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [comercio, setComercio] = useState<any>(null);
  const navigate = useNavigate();

  const comercioId = searchParams.get('id');

  useEffect(() => {
    if (comercioId) {
      fetchComercio();
    } else {
      setLoading(false);
      setStatus('error');
      setMessage('ID de comercio no proporcionado.');
    }
  }, [comercioId]);

  async function fetchComercio() {
    try {
      const { data, error } = await supabase
        .from('comercios')
        .select('*')
        .eq('id', comercioId)
        .single();

      if (error) throw error;
      setComercio(data);
    } catch (err: any) {
      setStatus('error');
      setMessage('No se pudo encontrar el comercio.');
    } finally {
      setLoading(false);
    }
  }

  const handleActivate = async () => {
    if (!comercioId) return;
    setLoading(true);
    try {
      // Calcular fecha de expiración (30 días desde hoy)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const { error } = await supabase
        .from('comercios')
        .update({
          plan_status: 'active',
          plan_expiration: expirationDate.toISOString()
        })
        .eq('id', comercioId);

      if (error) {
        if (error.message.includes('permission denied')) {
          throw new Error('No tienes permisos para activar este comercio. La activación debe ser realizada por el Administrador de FullShell o mediante SQL.');
        }
        throw error;
      }
      
      setStatus('success');
      setMessage('¡Comercio activado correctamente por 30 días!');
    } catch (err: any) {
      setStatus('error');
      setMessage('Error al activar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
        <p className="text-zinc-500 font-medium">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">Activación de Membresía</h2>
          <p className="text-zinc-500">Panel de Control Administrativo</p>
        </div>

        {status === 'idle' && comercio && (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Comercio a Activar</p>
              <p className="text-lg font-bold text-zinc-900">{comercio.nombre}</p>
              <p className="text-xs text-zinc-500">ID: {comercio.id}</p>
              <p className="text-xs text-zinc-500">Estado Actual: <span className="font-bold uppercase">{comercio.plan_status}</span></p>
            </div>

            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar por 30 Días'}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <p className="text-emerald-700 font-medium">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <p className="text-red-700 font-medium">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
