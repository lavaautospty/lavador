import React from 'react';
import { AlertCircle, MessageSquare, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function PlanExpirado() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">Membresía Vencida</h2>
          <p className="text-zinc-500">Tu periodo de prueba o suscripción ha finalizado. Para continuar usando FullShell, por favor realiza tu pago.</p>
        </div>

        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Instrucciones de Pago</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <span className="text-sm font-medium text-zinc-600">Yappy / CMF:</span>
              <span className="text-sm font-bold text-zinc-900">6027-5561</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <span className="text-sm font-medium text-zinc-600">Banco General:</span>
              <span className="text-xs font-bold text-zinc-900">Ahorros 04-72-98-123456-7</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-medium text-zinc-600">Monto Mensual:</span>
              <span className="text-lg font-bold text-zinc-900">$24.99</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <a 
            href="https://wa.me/50760275561?text=Hola%2C%20acabo%20de%20realizar%20el%20pago%20de%20mi%20membres%C3%ADa%20FullShell.%20Adjunto%20comprobante."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Enviar Comprobante por WhatsApp
          </a>
          
          <button 
            onClick={handleLogout}
            className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 italic">
          Una vez enviado el comprobante, nuestro equipo activará tu cuenta en pocos minutos.
        </p>
      </div>
    </div>
  );
}
