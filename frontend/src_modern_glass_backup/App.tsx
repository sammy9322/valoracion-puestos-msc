import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, FileSignature, Settings, ShieldAlert, Target, BarChart2, Calculator, BadgeDollarSign, Moon, Sun, Bell } from 'lucide-react';
import FichasPuestos from './pages/FichasPuestos';
import EncuestaSalario from './pages/EncuestaSalario';
import PuestosClave from './pages/PuestosClave';
import WizardEvaluacion from './pages/WizardEvaluacion';
import CalculoVP from './pages/CalculoVP';
import Asignaciones from './pages/Asignaciones';

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
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/fichas', icon: <Briefcase size={18} />, label: 'Puestos' },
    { path: '/puestos-clave', icon: <Target size={18} />, label: 'Puestos Clave' },
    { path: '/encuesta', icon: <BarChart2 size={18} />, label: 'Encuesta Mercado' },
    { path: '/evaluaciones', icon: <FileSignature size={18} />, label: 'Evaluaciones' },
    { path: '/calculo-vp', icon: <Calculator size={18} />, label: 'Valor de Punto (VP)' },
    { path: '/asignaciones', icon: <BadgeDollarSign size={18} />, label: 'Asignación Legal' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Floating Glass Effect */}
      <aside className="w-72 glass-panel m-4 rounded-3xl flex flex-col pt-8 pb-6 shadow-soft z-10 relative overflow-hidden">
        
        {/* Glow effect in background of sidebar */}
        <div className="absolute top-0 -left-1/2 w-full h-1/2 bg-primary/10 blur-3xl rounded-full -z-10"></div>
        
        <div className="mb-8 px-6 text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-primary to-indigo-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-glow mb-4">
            MSC
          </div>
          <h1 className="font-extrabold text-lg tracking-tight text-foreground">Municipalidad</h1>
          <p className="text-xs text-primary uppercase font-bold mt-1 tracking-widest">Capital Humano</p>
        </div>
        
        <nav className="w-full flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden p-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-glow scale-100' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="w-full px-4 mt-auto pt-6">
          <div className="bg-gradient-to-tr from-orange-500/10 to-orange-400/5 border border-orange-500/20 p-4 rounded-2xl hover:border-orange-500/40 transition-colors">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm mb-1">
              <ShieldAlert size={16} /> Estado SEVRI
            </div>
            <p className="text-xs text-orange-700/80 dark:text-orange-300/80 leading-relaxed font-medium">Riesgo R21 y R23 en monitoréo constante.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full rounded-l-3xl overflow-hidden relative">
        <header className="h-20 glass-header flex items-center justify-between px-10 z-10 sticky top-0">
          <h2 className="text-2xl font-bold text-gradient">Plataforma de Valoración</h2>
          <div className="flex items-center gap-6">
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-110 shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="relative w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-110 shadow-sm">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            
            <div className="hidden md:block h-6 w-px bg-border"></div>

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-glow transition-all">
                JD
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold leading-none">Jefe Depto</p>
                <p className="text-xs text-muted-foreground mt-1">Recursos Humanos</p>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-10 flex-1 overflow-auto pb-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">Dashboard Ejecutivo</h1>
      <p className="text-muted-foreground text-lg">Resumen de la Valoración de Puestos según el Manual MSC 2024</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="p-8 rounded-3xl glass-panel relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 p-6 text-primary/10 group-hover:text-primary/20 transition-colors"><Briefcase size={64} /></div>
        <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-xs mb-3">Puestos Importados</h3>
        <p className="text-5xl font-black text-foreground">142</p>
        <p className="text-sm text-green-600 dark:text-green-400 font-bold mt-4 flex items-center gap-1">↑ 100% Sincronizado</p>
      </div>
      
      <div className="p-8 rounded-3xl glass-panel relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
         <div className="absolute top-0 right-0 p-6 text-primary/10 group-hover:text-primary/20 transition-colors"><FileSignature size={64} /></div>
        <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-xs mb-3">Sin Evaluar</h3>
        <p className="text-5xl font-black text-primary">1</p>
        <p className="text-sm text-muted-foreground mt-4 font-medium flex items-center gap-1">Pendientes de asignación de puntos</p>
      </div>
      
      <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-red-500/20 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 p-6 text-destructive/10 group-hover:text-destructive/20 transition-colors"><ShieldAlert size={64} /></div>
        <h3 className="font-bold text-destructive uppercase tracking-widest text-xs mb-3">Semáforos Ley MTSS</h3>
        <p className="text-5xl font-black text-destructive">2</p>
        <p className="text-sm text-destructive/80 mt-4 font-bold flex items-center gap-1">Puestos por debajo del umbral mínimo</p>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
