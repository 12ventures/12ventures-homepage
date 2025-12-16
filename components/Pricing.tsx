import React from 'react';
import Button from './ui/Button';
import { Calculator } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const Pricing: React.FC = () => {
  const { currentBrand } = useBrand();

  return (
    <section id="roi" className="py-24 bg-brand-900 relative overflow-hidden">
       {/* Background Patterns */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
       </div>

       <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-6">
                Calculate Your Potential Impact
            </h2>
            <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Discover how {currentBrand.name} can optimize your workforce efficiency, reduce turnover, and minimize reliance on temporary staffing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div className="bg-white/10 rounded-xl p-6 border border-white/5">
                    <div className="text-brand-300 text-sm font-medium mb-1">Estimated Annual Value</div>
                    <div className="text-3xl font-bold text-white">$1.2M</div>
                    <div className="text-xs text-brand-200 mt-2">Based on 500 bed facility</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-white/5">
                    <div className="text-brand-300 text-sm font-medium mb-1">Turnover Reduction</div>
                    <div className="text-3xl font-bold text-white">15%</div>
                    <div className="text-xs text-brand-200 mt-2">Conservative estimate</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-white/5">
                    <div className="text-brand-300 text-sm font-medium mb-1">Time Saved Per Nurse</div>
                    <div className="text-3xl font-bold text-white">12 Hrs</div>
                    <div className="text-xs text-brand-200 mt-2">During onboarding</div>
                </div>
            </div>

            <Button size="lg" className="!bg-white !text-brand-900 hover:!bg-brand-50 shadow-xl w-full sm:w-auto transition-colors">
                <Calculator className="mr-2 w-5 h-5" />
                Open ROI Calculator
            </Button>
            <p className="text-sm text-brand-300/60 mt-4">No credit card required. Customized report in 2 minutes.</p>

         </div>
       </div>
    </section>
  );
};

export default Pricing;