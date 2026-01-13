import React from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { ExternalLink } from 'lucide-react';

const ModernLMS: React.FC = () => {
  return (
    <PrismaDashboardLayout 
      title="Modern LMS Experience" 
      subtitle="Engaging, mobile-first learning platform"
    >
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <GlassCard className="w-full max-w-5xl overflow-hidden p-1 bg-white/40">
          <a 
            href="https://snapskill.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative group block overflow-hidden rounded-2xl"
          >
            {/* Main Image */}
            <img 
              src="/images/lms.png" 
              alt="SnapSkill LMS Interface" 
              className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-300 flex items-center justify-center">
               <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-full flex items-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-lg transform">
                  <span className="font-bold text-slate-900">Go to LMS</span>
                  <ExternalLink size={18} className="text-brand-600" />
               </div>
            </div>
          </a>
        </GlassCard>
        
        <p className="mt-6 text-slate-600 text-sm font-medium backdrop-blur-sm bg-white/30 px-4 py-1 rounded-full border border-white/40">
          Click to explore the full interactive platform at <span className="text-brand-700 font-bold hover:underline">snapskill.io</span>
        </p>
      </div>
    </PrismaDashboardLayout>
  );
};

export default ModernLMS;