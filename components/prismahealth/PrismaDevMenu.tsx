import React, { useEffect, useState } from 'react';
import { useBrand, brands } from '../../contexts/BrandingContext';

const PrismaDevMenu: React.FC = () => {
  const { currentBrand, setBrandId } = useBrand();
  const [isOpen, setIsOpen] = useState(false);

  // Filter for specific brands: Prisma Health and OtterWorks
  // We'll look for 'prisma-health' and 'otter-works' / 'otterworks'
  const allowedBrandIds = ['prisma-health', 'otterworks'];
  const prismaBrands = brands.filter(b => allowedBrandIds.includes(b.id));

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 w-64 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Brand Switcher</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
      </div>
      <div className="flex flex-col gap-2">
        {prismaBrands.map(brand => (
          <button
            key={brand.id}
            onClick={() => setBrandId(brand.id)}
            className={`px-3 py-2 rounded-xl text-sm text-left transition-all flex justify-between items-center border ${
              currentBrand.id === brand.id 
                ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold shadow-sm' 
                : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
               {brand.name}
            </div>
            {currentBrand.id === brand.id && <span className="w-2 h-2 rounded-full bg-brand-500"></span>}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
        Press <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">`</code> to toggle
      </div>
    </div>
  );
};

export default PrismaDevMenu;