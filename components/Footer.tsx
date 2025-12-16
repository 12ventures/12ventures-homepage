import React from 'react';
import { useBrand } from '../contexts/BrandingContext';

const Footer: React.FC = () => {
  const { currentBrand } = useBrand();

  const links = {
    Platform: ['Features', 'ROI Calculator', 'Security', 'Integrations'],
    Company: ['About Us', 'Careers', 'Blog', 'Contact'],
    Resources: ['Case Studies', 'Whitepapers', 'Support', 'Legal'],
  };

  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200 text-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <img 
                    src={currentBrand.logoUrl} 
                    alt={currentBrand.name} 
                    className="h-6 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" 
                />
            </div>
            <p className="text-slate-500 max-w-xs mb-6">
              The all-in-one platform for modern healthcare workforces. Achieve financial resilience through better retention.
            </p>
            <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-brand-300 hover:text-brand-600 cursor-pointer transition-colors text-slate-400">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
            </div>
          </div>
          
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-slate-900 mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500">© 2024 {currentBrand.name} Inc. All rights reserved.</p>
            <div className="flex gap-6">
                <a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Privacy Policy</a>
                <a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Terms of Service</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;