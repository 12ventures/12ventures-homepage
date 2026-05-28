import React from 'react';
import { ArrowRight, Layers, Shield, LineChart } from 'lucide-react';

const OtterWorkerLearn: React.FC = () => {
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
              <span className="mr-3 text-blue-500">|</span> Learn
            </div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">
              AI Learning & Workforce Performance for Healthcare
            </p>
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

          {/* Banner */}
          <div className="bg-[#0F1A2E] border border-blue-900/50 rounded-lg px-5 py-3 text-center">
            <p className="text-sm font-semibold">
              Onboarding • Just-In-Time Reinforcement • EHR & Systems Training
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <Layers className="w-4 h-4" />,
                title: 'Adaptive learning',
                desc: 'Right knowledge, right format, right time.',
              },
              {
                icon: <Shield className="w-4 h-4" />,
                title: 'Compliance built-in',
                desc: 'Trackable, auditable execution by default.',
              },
              {
                icon: <LineChart className="w-4 h-4" />,
                title: 'Performance analytics',
                desc: 'Live visibility into readiness and ROI.',
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
          <div className="flex items-center justify-between pb-2">
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

export default OtterWorkerLearn;
