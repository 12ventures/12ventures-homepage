import React from 'react';
import { ArrowRight } from 'lucide-react';

const BookDemoButton: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'lg' }) => (
  <button className={`group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold rounded-full flex items-center hover:opacity-95 transition-all shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:shadow-[0_0_60px_rgba(56,189,248,0.7)] hover:scale-105 ${size === 'lg' ? 'py-4 px-10 text-base' : size === 'md' ? 'py-3 px-7 text-sm' : 'py-2 px-5 text-xs'}`}>
    Book a demo
    <ArrowRight className={`ml-2 group-hover:translate-x-1 transition-transform ${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
  </button>
);

const OtterWorkerOperator: React.FC = () => {
  return (
    <div className="h-screen bg-[#060B14] text-white font-sans overflow-hidden flex flex-col">
      {/* Main layout: left content + right image */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left content column */}
        <div className="flex flex-col justify-between w-full md:w-[55%] px-8 pt-10 pb-6">

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative inline-flex items-end">
              {/* "Operator" pill — top-right above the I */}
              <span className="absolute -top-5 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                Operator
              </span>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-none">
                OTTERWORKER<span className="ml-4">I</span>
              </h1>
            </div>
            <BookDemoButton size="md" />
          </div>

          {/* Tagline */}
          <div>
            <p className="text-xl font-bold leading-snug text-white/90 max-w-md">
              24/7 Standardized Labor On-Demand. Fraction of Cost.
            </p>
          </div>

          {/* Operators for grid */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">
              Otterworker I • Operators For
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Patient + Employee Calls',
                'Scheduling + Coordination',
                'Billing + Pre-Authorizations',
                'Fax + Multi-Systems Workflows',
              ].map((item) => (
                <div
                  key={item}
                  className="bg-[#0F1A2E] border-l-2 border-blue-500 rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why leaders section */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">
              Why Leaders Choose Otterworker I • Operator
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { title: 'More Capacity', desc: 'Scale operations without increasing headcount' },
                { title: 'Consistent Standards', desc: 'Reliable execution' },
                { title: '24/7 Coverage', desc: 'Always available' },
                { title: 'Fraction of the Cost', desc: 'Massive savings and ROI' },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-bold text-blue-400 leading-tight mb-2">{item.title}</h3>
                  <div className="h-px w-full bg-blue-800/60 mb-2"></div>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom banner */}
          <div className="bg-[#0F1A2E] border border-blue-900/50 rounded-lg px-5 py-3">
            <p className="text-sm font-semibold">
              Operational execution across systems, teams and channels.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pb-1">
            <p className="text-gray-600 text-xs">We help your people do their best work.</p>
            <a href="mailto:operator@otterworks.ai" className="text-gray-400 text-xs hover:text-white transition-colors">
              operator@otterworks.ai
            </a>
          </div>
        </div>

        {/* Right image column */}
        <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center">
          <img
            src="/images/operator_banner.png"
            alt="Operator"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B14] via-[#060B14]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-transparent to-[#060B14]/10"></div>
          <div className="relative z-10">
            <BookDemoButton size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtterWorkerOperator;
