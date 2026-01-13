import React from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  BookOpen, 
  Calculator, 
  RefreshCcw, 
  BarChart3,
  ArrowRight
} from 'lucide-react';

const PrismaHub: React.FC = () => {
  const demos = [
    {
      title: 'Governance Tool',
      description: 'Streamline regulatory compliance and internal standards tracking across all facilities.',
      path: '/prismahealth/governance-tool',
      icon: ShieldCheck,
      color: 'bg-blue-500',
    },
    {
      title: 'Modern LMS',
      description: 'An intuitive learning management system designed for the modern healthcare workforce.',
      path: '/prismahealth/modern-lms',
      icon: BookOpen,
      color: 'bg-teal-500',
    },
    {
      title: 'Training Economics',
      description: 'Analyze and optimize the financial impact of your clinical training programs.',
      path: '/prismahealth/training-economics-calculator',
      icon: Calculator,
      color: 'bg-purple-500',
    },
    {
      title: 'Learning Lifecycle',
      description: 'Track the end-to-end journey of clinician development from onboarding to mastery.',
      path: '/prismahealth/learning-lifecycle',
      icon: RefreshCcw,
      color: 'bg-orange-500',
    },
    {
      title: 'Metric Dashboard',
      description: 'Real-time visualization of key performance indicators and learning outcomes.',
      path: '/prismahealth/metric-dashboard',
      icon: BarChart3,
      color: 'bg-rose-500',
    },
  ];

  return (
    <PrismaDashboardLayout 
      title="Prisma Health Innovation Hub" 
      subtitle="Select an application to explore our healthcare learning solutions"
    >
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {demos.map((demo) => (
            <Link key={demo.path} to={demo.path} className="block h-full">
              <GlassCard className="p-5 hover:shadow-xl hover:bg-white/80 transition-all duration-300 flex flex-col h-full group">
                <div className={`w-10 h-10 ${demo.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <demo.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{demo.title}</h3>
                <p className="text-slate-600 text-xs mb-4 flex-1 font-medium">{demo.description}</p>
                <div className="flex items-center text-brand-700 font-bold text-xs group-hover:gap-2 transition-all">
                  Launch App <ArrowRight size={14} className="ml-1" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
        
        <div className="mt-6 flex-shrink-0">
          <GlassCard className="p-6 !bg-gradient-to-br from-brand-600/90 to-teal-600/90 !border-white/20 text-white backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold mb-2 text-white">Transforming Healthcare Education</h2>
                <p className="text-white/90 font-medium text-sm">
                  Our suite of tools is designed specifically for large healthcare systems like Prisma Health, 
                  focusing on clinical excellence, operational efficiency, and measurable ROI.
                </p>
              </div>
              <button className="bg-white text-brand-700 px-6 py-2 rounded-full font-bold text-xs hover:bg-brand-50 transition-colors shadow-lg whitespace-nowrap ml-6">
                Contact 12 Ventures Support
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </PrismaDashboardLayout>
  );
};

export default PrismaHub;