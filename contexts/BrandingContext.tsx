import React, { createContext, useContext, useState, useEffect } from 'react';

export type Brand = {
  id: string;
  name: string;
  logoUrl: string;
};

export const brands: Brand[] = [
  { id: 'default', name: 'Otter IQ', logoUrl: 'https://i.imgur.com/MscrBR9.png' },
  { id: 'otter-works', name: 'Otter Works', logoUrl: 'https://i.imgur.com/7wrLUzC.png' },
  { id: 'otterworks', name: 'OtterWorks', logoUrl: 'https://i.imgur.com/LBaPxF3.png' },
  { id: 'skill-surf', name: 'Skill Surf', logoUrl: 'https://i.imgur.com/mFS7Vig.png' },
  { id: 'iq-otter', name: 'IQ Otter', logoUrl: 'https://i.imgur.com/MscrBR9.png' },
];

interface BrandingContextType {
  currentBrand: Brand;
  setBrandId: (id: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBrand, setCurrentBrand] = useState<Brand>(brands[0]);

  const setBrandId = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand) {
      setCurrentBrand(brand);
    }
  };

  useEffect(() => {
     document.title = `${currentBrand.name} - Modernize Nurse Onboarding`;
  }, [currentBrand]);

  return (
    <BrandingContext.Provider value={{ currentBrand, setBrandId }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandingProvider');
  }
  return context;
};