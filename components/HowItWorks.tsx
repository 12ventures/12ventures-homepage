import React from 'react';
import { FileText, Wand2, BarChart3, Smartphone } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const HowItWorks: React.FC = () => {
  const { currentBrand } = useBrand();
  const backgroundImage = currentBrand.wallpaperUrl ?? 'https://i.imgur.com/PIVqisf.jpeg';
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
        
        {/* Background Image Layer - iOS-safe */}
        <div 
            className="absolute inset-0 z-0 bg-wallpaper"
            style={{ backgroundImage: `url("${backgroundImage}")` }}
        ></div>

        {/* Gradient Overlay for Text Readability: Solid on left, fading to transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-0"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-16 items-center">
                
                <div className="w-full md:w-1/2">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-12 drop-shadow-sm">
                        From 100-page PDF to <br />
                        <span className="text-brand-600">Gen Z-Ready Content.</span>
                    </h2>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                <FileText className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">1. AI Content Transformation</h4>
                                <p className="text-slate-800 font-medium">Upload your static manuals. The AI instantly converts them into engaging scripts and questions, streamlining content creation time by 90%.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                <Smartphone className="w-5 h-5 text-brand-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">2. Gen Z-Friendly Media</h4>
                                <p className="text-slate-800 font-medium">Content is delivered via interactive quizzes, short-form videos, and comics. Transforms passive viewing into active engagement.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                <BarChart3 className="w-5 h-5 text-teal-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">3. Analytics & Reporting</h4>
                                <p className="text-slate-800 font-medium">Prove knowledge retention with granular data. Validates your training effectiveness and demonstrates clear ROI.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 relative">
                    {/* Visual representation of transformation - More transparent glass effect */}
                    <div className="relative bg-white/30 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 p-6 md:p-8 aspect-[4/3] flex flex-col items-center justify-center">
                        
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 to-transparent rounded-2xl pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-8 w-full justify-center">
                            {/* PDF Icon */}
                            <div className="w-20 h-24 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50 flex flex-col items-center justify-center relative shadow-sm">
                                <div className="absolute top-0 right-0 p-1">
                                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                </div>
                                <div className="w-12 h-1 bg-slate-400/50 rounded mb-2"></div>
                                <div className="w-12 h-1 bg-slate-400/50 rounded mb-2"></div>
                                <div className="w-8 h-1 bg-slate-400/50 rounded"></div>
                            </div>
                            
                            {/* Arrow / AI Engine - Glassified */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg relative z-20 mx-2">
                                <span className="text-[10px] font-bold text-brand-800 uppercase tracking-widest mb-1">AI Engine</span>
                                <Wand2 className="w-6 h-6 text-brand-600 animate-pulse" />
                            </div>

                            {/* Mobile App Interface */}
                            <div className="w-24 h-40 bg-slate-900 rounded-xl border-4 border-slate-800 shadow-xl overflow-hidden relative flex flex-col">
                                <div className="bg-brand-500 h-1/3 w-full flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm"></div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <div className="h-2 w-full bg-slate-700 rounded"></div>
                                    <div className="h-2 w-2/3 bg-slate-700 rounded"></div>
                                    <div className="mt-2 grid grid-cols-2 gap-1">
                                        <div className="h-8 bg-slate-800 rounded border border-slate-700"></div>
                                        <div className="h-8 bg-brand-600 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center relative z-10">
                            <div className="inline-block bg-green-100/90 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-2 shadow-sm border border-green-200/50">
                                Transformation Complete
                            </div>
                            <p className="text-sm text-slate-700 font-semibold text-shadow-sm">Ready for deployment in minutes.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
  );
};

export default HowItWorks;