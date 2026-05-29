import React from 'react';
import { ArrowRight, Layers, Shield, LineChart } from 'lucide-react';

const BookDemoButton: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'lg' }) => (
  <button className={`group bg-gradient-to-r from-blue-400 to-cyan-400 text-[#060B14] font-bold rounded-full flex items-center hover:opacity-95 transition-all shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:shadow-[0_0_60px_rgba(56,189,248,0.7)] hover:scale-105 ${size === 'lg' ? 'py-4 px-10 text-base' : size === 'md' ? 'py-3 px-7 text-sm' : 'py-2 px-5 text-xs'}`}>
    Book a demo
    <ArrowRight className={`ml-2 group-hover:translate-x-1 transition-transform ${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
  </button>
);

const OtterWorkerLearn: React.FC = () => {
  return (
    <div className="h-screen bg-[#060B14] text-white font-sans overflow-hidden flex flex-col">
      {/* Main layout: left content + right image */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left content column */}
        <div className="flex flex-col justify-between w-full md:w-[55%] px-8 pt-10 pb-6">

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative inline-flex items-end">
              {/* "Learn" pill — top-right above the I */}
              <span className="absolute -top-5 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                Learn
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
              Turn standards into measurable performance, compliance & ROI.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { stat: '+40%', label: 'Higher competency' },
              { stat: '2×', label: 'Faster time to floor' },
              { stat: '$1M+', label: 'Annual ROI' },
            ].map((item) => (
              <div
                key={item.stat}
                className="bg-[#0F1A2E] border border-blue-900/30 rounded-lg px-4 py-4"
              >
                <h3 className="text-3xl font-black mb-1">{item.stat}</h3>
                <p className="text-xs text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Onboarding cards — 3 separate items like stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              'Onboarding',
              'Just-In-Time Reinforcement',
              'EHR & Systems Training',
            ].map((item) => (
              <div
                key={item}
                className="bg-[#0F1A2E] border border-blue-900/50 rounded-lg px-4 py-4 flex items-center justify-center text-center"
              >
                <p className="text-sm font-semibold leading-snug">{item}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <Layers className="w-4 h-4" />,
                title: 'Adaptive learning',
                desc: 'Deliver the right knowledge, in the right format, at the right time',
              },
              {
                icon: <Shield className="w-4 h-4" />,
                title: 'Compliance built-in',
                desc: 'Standards become trackable, auditable execution by default',
              },
              {
                icon: <LineChart className="w-4 h-4" />,
                title: 'Performance analytics',
                desc: 'Live visibility into readiness, gaps and ROI',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="w-8 h-8 rounded-md bg-blue-900/30 border border-blue-800/50 flex items-center justify-center mb-2 text-blue-400">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer tagline + email */}
          <div className="flex items-center justify-between pb-1">
            <p className="text-gray-600 text-xs">We help your people do their best work.</p>
            <a href="mailto:learn@otterworks.ai" className="text-gray-400 text-xs hover:text-white transition-colors">
              learn@otterworks.ai
            </a>
          </div>
        </div>

        {/* Right image column */}
        <div className="hidden md:flex flex-1 relative overflow-hidden items-center justify-center">
          <img
            src="/images/learn_banner.png"
            alt="Learn"
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

export default OtterWorkerLearn;
