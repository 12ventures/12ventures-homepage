import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { useBrand } from '../contexts/BrandingContext';
import { openCalendarBooking } from '../utils/calendar';

const Header: React.FC = () => {
  const { currentBrand } = useBrand();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <img 
             src={currentBrand.logoUrl} 
             alt={currentBrand.name} 
             className="h-8 w-auto object-contain" 
           />
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Value Pillars</a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">How It Works</a>
          <a href="#case-studies" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Case Studies</a>
          <a href="#roi" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">ROI</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button size="sm" onClick={openCalendarBooking}>
            Book a Demo
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;