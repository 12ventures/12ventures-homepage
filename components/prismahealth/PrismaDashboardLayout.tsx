import React from 'react';
import { useBrand } from '../../contexts/BrandingContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  BookOpen, 
  Calculator, 
  RefreshCcw, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

import { Toaster } from 'sonner';
import PrismaDevMenu from './PrismaDevMenu';

interface PrismaDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const PrismaDashboardLayout: React.FC<PrismaDashboardLayoutProps> = ({ children, title, subtitle }) => {
  const { currentBrand } = useBrand();
  const location = useLocation();

  const navItems = [
    { name: 'Governance Tool', path: '/prismahealth/governance-tool', icon: ShieldCheck },
    { name: 'Modern LMS', path: '/prismahealth/modern-lms', icon: BookOpen },
    { name: 'Training Economics', path: '/prismahealth/training-economics-calculator', icon: Calculator },
    { name: 'Learning Lifecycle', path: '/prismahealth/learning-lifecycle', icon: RefreshCcw },
    { name: 'Metric Dashboard', path: '/prismahealth/metric-dashboard', icon: BarChart3 },
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed flex relative"
      style={{ 
        backgroundImage: 'url("https://lp.prismahealth.org/global/assets/images/Hero.jpg")',
      }}
    >
      <Toaster position="top-right" richColors closeButton />
      <PrismaDevMenu />
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-0 pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-64 bg-white/40 backdrop-blur-xl border-r border-white/40 flex flex-col fixed h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-white/20 flex items-center gap-3">
          <Link to="/prismahealth">
            <img 
              src={currentBrand.logoUrl} 
              alt="Prisma Health" 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link 
            to="/prismahealth"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              location.pathname === '/prismahealth' 
                ? 'bg-white/60 text-brand-700 shadow-sm' 
                : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <LayoutDashboard size={18} />
            Overview Hub
          </Link>
          
          <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Applications
          </div>
          
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                location.pathname === item.path 
                  ? 'bg-white/60 text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/20">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-brand-600 transition-colors px-2">
            <ChevronRight size={14} className="rotate-180" />
            Back to 12 Ventures
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen relative z-10">
        <header className="h-20 bg-white/30 backdrop-blur-md border-b border-white/30 flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-600 font-medium">{subtitle}</p>}
          </div>
        </header>
        
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrismaDashboardLayout;