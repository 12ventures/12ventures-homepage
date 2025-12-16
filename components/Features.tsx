import React from 'react';
import { Users, Clock, ShieldAlert } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section id="benefits" className="py-24 relative border-b border-slate-100 overflow-hidden">
      
      {/* Abstract Background Blobs - Replaces Photo for visual staggering */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50/50">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-200/40 rounded-full blur-[120px] mix-blend-multiply opacity-70"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent-teal/20 rounded-full blur-[120px] mix-blend-multiply opacity-70"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-[80px] -z-10"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-20 text-center max-w-3xl mx-auto bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-lg ring-1 ring-white/50">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-6 drop-shadow-sm">Real Results, Real Impact</h2>
          <p className="text-xl text-slate-800 font-medium">We combine engaging learning experiences with measurable operational improvements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1: Retention */}
          <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 hover:bg-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-500 border border-white/60 hover:border-white/80">
             <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             
             <div className="w-14 h-14 rounded-2xl bg-blue-500/10 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-200/50">
                <Users className="w-7 h-7 text-blue-700" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-4 drop-shadow-sm">Retention & Turnover</h3>
             <div className="space-y-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-800">$56k</span>
                    <span className="text-sm text-slate-700 font-semibold">cost per RN turnover</span>
                 </div>
                 <p className="text-sm text-slate-800 font-semibold border-l-2 border-blue-400/50 pl-3">
                    Every 1% improvement in retention = <span className="text-blue-900">$262K annual value</span>
                 </p>
             </div>
          </div>

          {/* Pillar 2: Time-to-Competency */}
          <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 hover:bg-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-500 border border-white/60 hover:border-white/80">
             <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             
             <div className="w-14 h-14 rounded-2xl bg-teal-500/10 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-teal-200/50">
                <Clock className="w-7 h-7 text-teal-700" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-4 drop-shadow-sm">Time-to-Competency</h3>
             <div className="space-y-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-teal-800">50%</span>
                    <span className="text-sm text-slate-700 font-semibold">faster onboarding</span>
                 </div>
                 <p className="text-sm text-slate-800 font-semibold border-l-2 border-teal-400/50 pl-3">
                    Deploy permanent staff faster, saving <span className="text-teal-900">$350K+</span> on traveler RN costs.
                 </p>
             </div>
          </div>

          {/* Pillar 3: Risk & Compliance */}
          <div className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 hover:bg-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-500 border border-white/60 hover:border-white/80">
             <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             
             <div className="w-14 h-14 rounded-2xl bg-purple-500/10 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-200/50">
                <ShieldAlert className="w-7 h-7 text-purple-700" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-4 drop-shadow-sm">Risk & Compliance</h3>
             <div className="space-y-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-800">100%</span>
                    <span className="text-sm text-slate-700 font-semibold">audit trail</span>
                 </div>
                 <p className="text-sm text-slate-800 font-semibold border-l-2 border-purple-400/50 pl-3">
                    Mitigate litigation risk by ensuring protocols like Sepsis care are truly absorbed.
                 </p>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;