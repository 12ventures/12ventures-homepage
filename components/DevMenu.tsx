import React, { useEffect, useState } from 'react';
import { useBrand, brands } from '../contexts/BrandingContext';

const DevMenu: React.FC = () => {
  const { currentBrand, setBrandId } = useBrand();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="fixed bottom-4 right-4 z-[100] bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-slate-700 w-64 animate-fade-in-up">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">A/B Brand Testing</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">&times;</button>
      </div>
      <div className="flex flex-col gap-2">
        {brands.map(brand => (
          <button
            key={brand.id}
            onClick={() => setBrandId(brand.id)}
            className={`px-3 py-2 rounded text-sm text-left transition-colors flex justify-between items-center ${
              currentBrand.id === brand.id 
                ? 'bg-brand-600 text-white font-medium' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {brand.name}
            {currentBrand.id === brand.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
        Press <code className="bg-slate-800 px-1 py-0.5 rounded">`</code> to toggle menu
      </div>
    </div>
  );
};

export default DevMenu;