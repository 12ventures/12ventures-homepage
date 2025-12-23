import React, { useState } from 'react';
import Button from './ui/Button';
import { Calculator, Calendar, Bell } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';
import ROICalculatorModal from './ROICalculatorModal';
import { openCalendarBooking } from '../utils/calendar';

const Hero: React.FC = () => {
  const { currentBrand } = useBrand();
  const backgroundImage = currentBrand.wallpaperUrl ?? 'https://i.imgur.com/PIVqisf.jpeg';
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden pt-24 pb-20">
      
      {/* Background Image Layer - iOS-safe */}
      <div 
        className="absolute inset-0 z-0 bg-wallpaper"
        style={{ backgroundImage: `url("${backgroundImage}")` }}
      ></div>

      {/* Gradient Overlay: Solid on left for text readability, fully transparent on right for vibrant image */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent"></div>

      {/* Decorative Blur Blobs (retained but adjusted opacity) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-200/30 rounded-full blur-[120px] z-0 translate-x-1/3 -translate-y-1/4 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-teal/10 rounded-full blur-[100px] z-0 -translate-x-1/4 translate-y-1/4"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in-up">
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight mb-6 leading-[1.1] text-slate-900 drop-shadow-sm">
              We help your people do their <span className="text-gradient-brand">best work.</span>
            </h1>

            <h2 className="text-xl md:text-2xl text-slate-700 mb-8 max-w-xl font-light leading-relaxed font-medium">
              Unlock <span className="font-semibold text-brand-600">millions to tens of millions</span> with the all-in-one platform built to support your people.
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                size="lg" 
                className="group shadow-brand-500/30"
                onClick={() => setIsCalculatorOpen(true)}
              >
                <Calculator className="mr-2 w-5 h-5" />
                Calculate Your Impact
              </Button>
              <button 
                onClick={openCalendarBooking}
                className="inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-brand-500 bg-white/80 backdrop-blur-md text-slate-700 border border-slate-300 hover:bg-white hover:text-brand-600 hover:border-slate-400 px-8 py-4 text-lg group shadow-sm"
              >
                <Calendar className="mr-2 w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                Book a Demo
              </button>
            </div>
          </div>

          <div className="w-full flex justify-center lg:justify-center perspective-1000">
             {/* Wrapper to group image and decorations together for alignment */}
             <div className="relative">
                 
                 {/* Mascot Layer - Sizes reduced significantly */}
                 <div className="relative z-20 w-[180px] sm:w-[240px] lg:w-[320px] animate-float">
                    <img 
                        src={currentBrand.mascotUrl ?? 'https://i.imgur.com/jdyGGMx.png'}
                        alt={`${currentBrand.name} Mascot`}
                        className="w-full h-auto drop-shadow-2xl"
                    />
                 </div>
                 
                 {/* Abstract UI Elements Behind/Around Mascot - Centered relative to wrapper */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-[0_0_60px_rgba(255,255,255,0.3)] -z-10"></div>
                 
                 {/* Floating UI Card - "Push Notification" - Scaled down & Positioned relative to wrapper */}
                 <div className="absolute top-10 -left-10 sm:-left-24 lg:-left-20 bg-white/80 backdrop-blur-xl p-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-white/60 w-48 rotate-[-6deg] z-30 hidden sm:block animate-pulse-slow">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
                          <Bell className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                              <span className="text-[10px] font-bold text-slate-900">{currentBrand.name}</span>
                              <span className="text-slate-400 text-[8px]">now</span>
                          </div>
                          <div className="text-[10px] text-slate-700 font-medium leading-tight">New content available!</div>
                      </div>
                    </div>
                 </div>

                 {/* Floating UI Card - "After" - Scaled down & Positioned relative to wrapper */}
                 <div className="absolute bottom-12 -right-6 sm:-right-12 lg:-right-8 bg-white/80 backdrop-blur-xl p-3 rounded-xl shadow-[0_20px_40px_rgba(14,165,233,0.15)] border border-brand-100 w-44 rotate-[6deg] z-30 hidden sm:block">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] font-bold text-slate-900">Module Complete!</div>
                        <div className="text-[9px] font-bold text-brand-600">100%</div>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full w-full bg-brand-500"></div>
                    </div>
                    <div className="text-[8px] text-brand-600 font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                        Retention Optimized
                    </div>
                 </div>
             </div>
          </div>

        </div>
      </div>

      <ROICalculatorModal 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />
    </section>
  );
};

export default Hero;