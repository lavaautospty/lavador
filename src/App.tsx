import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Settings, 
  LogOut, 
  DollarSign, 
  PlusCircle, 
  Menu, 
  X,
  CreditCard,
  Gift,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { cn } from './lib/utils';

// Pages
import Dashboard from './pages/Dashboard';
import Lavados from './pages/Lavados';
import Clientes from './pages/Clientes';
import Servicios from './pages/Servicios';
import Empleados from './pages/Empleados';
import Fidelidad from './pages/Fidelidad';
import Configuracion from './pages/Configuracion';
import Auth from './pages/Auth';
import RegistroComercio from './pages/RegistroComercio';
import AdminActivar from './pages/AdminActivar';
import PlanExpirado from './pages/PlanExpirado';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [comercio, setComercio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasComercio, setHasComercio] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkComercio(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkComercio(session.user.id);
      } else {
        setHasComercio(null);
        setComercio(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkComercio(userId: string) {
    try {
      const { data, error } = await supabase
        .from('comercios')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();
      
      const exists = !!data;
      setHasComercio(exists);
      if (data) setComercio(data);
      return exists;
    } catch (error) {
      console.error('Error checking commerce:', error);
      setHasComercio(false);
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && session && hasComercio === false && location.pathname !== '/registro-comercio') {
      checkComercio(session.user.id).then((exists) => {
        if (!exists) navigate('/registro-comercio');
      });
    }

    // Check for expired plan
    if (!loading && session && comercio && location.pathname !== '/plan-expirado' && location.pathname !== '/admin/activar') {
      const now = new Date();
      const trialEnds = comercio.trial_ends_at ? new Date(comercio.trial_ends_at) : null;
      const planExpiration = comercio.plan_expiration ? new Date(comercio.plan_expiration) : null;

      let isExpired = false;

      if (comercio.plan_status === 'expired') {
        isExpired = true;
      } else if (comercio.plan_status === 'trial' && trialEnds && trialEnds < now) {
        isExpired = true;
      } else if (comercio.plan_status === 'active' && planExpiration && planExpiration < now) {
        isExpired = true;
      }

      if (isExpired) {
        navigate('/plan-expirado');
      }
    }
  }, [location.pathname, session, loading, hasComercio, comercio, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Lavados', path: '/lavados', icon: Car },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Servicios', path: '/servicios', icon: DollarSign },
    { name: 'Empleados', path: '/empleados', icon: UserCheck },
    { name: 'Fidelidad', path: '/fidelidad', icon: Gift },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tighter text-zinc-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden">
                {comercio?.logo_url ? (
                  <img src={comercio.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Car className="w-5 h-5 text-white" />
                )}
              </div>
              {comercio?.nombre || 'FullShell'}
            </h1>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            
            <a
              href="https://wa.me/50760275561?text=Hola%2C%20necesito%20soporte%20con%20mi%20app%20FullShell"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Soporte Técnico
            </a>
          </nav>

          <div className="p-4 border-t border-zinc-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 -ml-2 text-zinc-600" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-900">{session.user.email}</p>
              <p className="text-xs text-zinc-500">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-bold">
              {session.user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lavados" element={<Lavados />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/empleados" element={<Empleados />} />
            <Route path="/fidelidad" element={<Fidelidad />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/registro-comercio" element={<RegistroComercio />} />
            <Route path="/admin/activar" element={<AdminActivar />} />
            <Route path="/plan-expirado" element={<PlanExpirado />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
