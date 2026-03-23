import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Mail, Lock, Store, Phone, MapPin, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.');
        setIsForgotPassword(false);
        setIsLogin(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage('¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar y activar tu cuenta antes de iniciar sesión.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
        <div className="p-8 bg-zinc-900 text-white text-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden">
              <img 
                src="/logo.png" 
                alt="FullShell Logo" 
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  // Fallback if logo.png is not uploaded yet
                  (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3002/3002655.png";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">FullShell</h1>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Smart Car Wash Systems</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {isForgotPassword ? 'Recuperar Contraseña' : isLogin ? 'Bienvenido de nuevo' : 'Crear nueva cuenta'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {isForgotPassword 
                  ? 'Introduce tu correo para recibir instrucciones' 
                  : isLogin 
                    ? 'Ingresa tus credenciales para acceder' 
                    : 'Regístrate para empezar a gestionar tu negocio'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-bold text-xs">!</span>
                </div>
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{successMessage}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                  placeholder="admin@carwash.com"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contraseña</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required={!isForgotPassword}
                  />
                </div>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="rememberMe" className="text-sm text-zinc-500 cursor-pointer select-none">Recordar mi correo</label>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? 'Procesando...' : isForgotPassword ? 'Enviar Instrucciones' : isLogin ? 'Entrar' : 'Crear Cuenta'}
            </button>

            {isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            )}
          </form>

          {!isForgotPassword && (
            <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {isLogin ? (
                  <>¿No tienes cuenta? <span className="text-zinc-900 font-bold">Regístrate gratis</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span className="text-zinc-900 font-bold">Inicia sesión</span></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
