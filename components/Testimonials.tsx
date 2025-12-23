import React from 'react';
import { Quote } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const Testimonials: React.FC = () => {
  const { currentBrand } = useBrand();

  return (
    <section id="case-studies" className="py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-6">Trusted by Forward-Thinking Healthcare</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            
            {/* Main Case Study */}
            <div className="bg-slate-50 p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm md:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100 rounded-full blur-3xl -z-10 -mr-16 -mt-16 opacity-50"></div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-6 text-brand-600 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                            Case Study: MLK Community Healthcare
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
                            "Our nurses actually use the training now, and our educators have their time back."
                        </h3>
                        <p className="text-slate-600 mb-6 text-lg">
                            By switching to {currentBrand.name}, MLK Community Healthcare reduced onboarding time and saw a significant spike in voluntary training completion rates among their nursing staff.
                        </p>
                        <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-slate-200 rounded-full overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Director+Education&background=random" alt="User" />
                             </div>
                             <div>
                                <div className="font-bold text-slate-900">Sarah M.</div>
                                <div className="text-sm text-slate-500">Director of Clinical Education</div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Impact Metrics</h4>
                        <div className="space-y-4">
                            <div>
                            <div className="text-3xl font-bold text-brand-600">50%</div>
                                <div className="text-sm text-slate-600">Reduction in Onboarding Time</div>
                            </div>
                            <div className="w-full h-px bg-slate-100"></div>
                            <div>
                                <div className="text-3xl font-bold text-teal-600">98%</div>
                                <div className="text-sm text-slate-600">Knowledge Retention Score</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Testimonials;