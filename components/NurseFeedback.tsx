import React from 'react';
import { Star } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const NurseFeedback: React.FC = () => {
  const { currentBrand } = useBrand();
  const backgroundImage = currentBrand.wallpaperUrl ?? 'https://i.imgur.com/PIVqisf.jpeg';

  const reviews = [
    {
      name: "Sarah J.",
      role: "MST RN",
      quote: `${currentBrand.name} works perfectly`,
      avatar: "https://ui-avatars.com/api/?name=Sarah+J&background=0ea5e9&color=fff"
    },
    {
      name: "Mike T.",
      role: "ED RN",
      quote: "All hospitals should have this",
      avatar: "https://ui-avatars.com/api/?name=Mike+T&background=2dd4bf&color=fff"
    },
    {
      name: "Emily R.",
      role: "PCT",
      quote: "Information is clear and straight to the point, while being fun!",
      avatar: "https://ui-avatars.com/api/?name=Emily+R&background=818cf8&color=fff"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden border-b border-slate-200">
      
      {/* Background Image - iOS-safe */}
      <div 
        className="absolute inset-0 z-0 bg-wallpaper"
        style={{ backgroundImage: `url("${backgroundImage}")` }}
      ></div>

      {/* No overlay filter for vibrant look */}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-lg ring-1 ring-white/50">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-6 drop-shadow-sm">
            Loved by the Frontline
          </h2>
          <p className="text-xl text-slate-800 font-medium">
            Nurses are tired of outdated training. We built something they actually want to use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white/40 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 hover:bg-white/60 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] hover:border-white/70 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
               <div className="flex gap-1 mb-6">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="w-4 h-4 text-yellow-500 fill-current drop-shadow-sm" />
                 ))}
               </div>
               <p className="text-slate-900 text-lg mb-8 leading-relaxed font-semibold flex-grow drop-shadow-sm">"{review.quote}"</p>
               <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-200/50">
                 <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                 <div>
                   <div className="font-bold text-slate-900">{review.name}</div>
                   <div className="text-xs font-bold text-brand-700 uppercase tracking-wider">{review.role}</div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NurseFeedback;