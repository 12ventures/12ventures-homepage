import React from 'react';
import { ArrowRight } from 'lucide-react';

const OtterWorkerOperator: React.FC = () => {
  return (
    <div className="h-screen bg-[#060B14] text-white font-sans overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center px-8 pt-6 pb-2">
        <span className="text-white font-bold tracking-widest text-sm">OTTER<span className="font-normal">WORKS</span></span>
      </div>

      {/* Main layout: left content + right image */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left content column */}
        <div className="flex flex-col justify-between w-full md:w-[55%] px-8 py-4">
          {/* Title */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-none mb-1">
              OTTERWORKER I
            </h1>
            <div className="flex items-center text-2xl text-blue-400 font-light mb-4">
              <span className="mr-3 text-blue-500">|</span> Operator
            </div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">
              Agentic AI Workforce
            </p>
            <p className="text-xl font-bold leading-snug text-white/90 max-w-md">
              Instant 24/7 workforce capacity.<br />
              Consistent performance. Fraction of the cost.
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
                { title: 'More Capacity', desc: 'Scale without headcount.' },
                { title: 'Consistent Standards', desc: 'Reliable execution.' },
                { title: '24/7 Coverage', desc: 'Always available.' },
                { title: 'Fraction of Cost', desc: 'Lower financial burden.' },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-bold text-blue-400 leading-tight mb-1">{item.title}</h3>
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

          <div className="flex items-center justify-between pb-2">
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
          {/* Prominent CTA overlay */}
          <div className="relative z-10 flex flex-col items-center">
            <button className="group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold py-4 px-10 rounded-full flex items-center text-base hover:opacity-95 transition-all shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:shadow-[0_0_60px_rgba(56,189,248,0.7)] hover:scale-105">
              Book a demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtterWorkerOperator;
