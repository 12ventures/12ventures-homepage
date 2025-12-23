import React from 'react';
import Button from './ui/Button';
import { useBrand } from '../contexts/BrandingContext';
import { openCalendarBooking } from '../utils/calendar';

const CTA: React.FC = () => {
  const { currentBrand } = useBrand();
  const backgroundImage = currentBrand.wallpaperUrl ?? 'https://i.imgur.com/PIVqisf.jpeg';

  return (
    <section className="py-24 relative overflow-hidden">
      
      {/* Background Image Layer - iOS-safe */}
      <div 
        className="absolute inset-0 z-0 bg-wallpaper"
        style={{ backgroundImage: `url("${backgroundImage}")` }}
      ></div>

      {/* No Overlay - Raw Wallpaper */}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-white/60 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-6 drop-shadow-sm">
              Ready to empower your workforce?
            </h2>
            <p className="text-xl text-slate-800 font-medium mb-10">
              Join the hospitals that are transforming their training and retaining their best talent with {currentBrand.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-brand-500/20">Get Started Now</Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto bg-white/50 hover:bg-white border-slate-300"
                  onClick={openCalendarBooking}
                >
                  Book a Demo
                </Button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;