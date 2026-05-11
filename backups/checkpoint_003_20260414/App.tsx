import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, FileSignature, Settings, ShieldAlert, Target, BarChart2, Calculator, BadgeDollarSign, Moon, Sun, Bell, ClipboardList } from 'lucide-react';
import FichasPuestos from './pages/FichasPuestos';
import EncuestaSalario from './pages/EncuestaSalario';
import PuestosClave from './pages/PuestosClave';
import WizardEvaluacion from './pages/WizardEvaluacion';
import CalculoVP from './pages/CalculoVP';
import Asignaciones from './pages/Asignaciones';
import PanelAuditoria from './pages/PanelAuditoria';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navLinks = [
    { path: '/', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { path: '/fichas', icon: <Briefcase size={16} />, label: 'Puestos' },
    { path: '/puestos-clave', icon: <Target size={16} />, label: 'Puestos Clave' },
    { path: '/encuesta', icon: <BarChart2 size={16} />, label: 'Encuesta Mercado' },
    { path: '/evaluaciones', icon: <FileSignature size={16} />, label: 'Evaluaciones' },
    { path: '/calculo-vp', icon: <Calculator size={16} />, label: 'Valor de Punto' },
    { path: '/asignaciones', icon: <BadgeDollarSign size={16} />, label: 'Asignación' },
    { path: '/auditoria', icon: <ClipboardList size={16} />, label: 'Auditoría' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Solid Apple Gray */}
      <aside className="w-64 bg-card border-r flex flex-col shadow-sm z-10 transition-colors">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm mr-3">
            MS
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground">Municipalidad SC</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Valoración Salarial</p>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-500 font-semibold text-xs mb-1">
              <ShieldAlert size={14} /> Estado SEVRI
            </div>
            <p className="text-[10px] text-orange-600 dark:text-orange-400">Riesgos R21 y R23 activos.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-card border-b flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-semibold text-foreground">Sistema Integral RRHH</h2>
          <div className="flex items-center gap-4">
            
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full"></span>
            </button>
            
            <div className="h-4 w-px bg-border mx-2"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-foreground font-semibold text-xs">
                JD
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-8 flex-1 overflow-auto bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => (
  <div className="space-y-6">
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-foreground mb-1">Resumen Gerencial</h1>
      <p className="text-sm text-muted-foreground">Estadísticas de la plataforma según el Manual MSC 2024</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-lg bg-card border shadow-sm flex flex-col">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-2">Puestos Importados</h3>
        <p className="text-3xl font-semibold text-foreground">142</p>
        <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">100% Sincronizado</p>
      </div>
      
      <div className="p-6 rounded-lg bg-card border shadow-sm flex flex-col">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-2">Sin Evaluar</h3>
        <p className="text-3xl font-semibold text-foreground">1</p>
        <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">Fichas en desarrollo</p>
      </div>
      
      <div className="p-6 rounded-lg bg-card border shadow-sm border-l-4 border-l-destructive flex flex-col">
        <h3 className="font-semibold text-destructive text-xs uppercase tracking-wider mb-2">Semáforos MTSS</h3>
        <p className="text-3xl font-semibold text-foreground">2</p>
        <p className="text-xs text-muted-foreground mt-auto pt-4 flex items-center gap-1">Revisión SEVRI requerida</p>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fichas" element={<FichasPuestos />} />
          <Route path="/puestos-clave" element={<PuestosClave />} />
          <Route path="/encuesta" element={<EncuestaSalario />} />
          <Route path="/evaluaciones" element={<WizardEvaluacion />} />
          <Route path="/calculo-vp" element={<CalculoVP />} />
          <Route path="/asignaciones" element={<Asignaciones />} />
          <Route path="/auditoria" element={<PanelAuditoria />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
