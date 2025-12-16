import React, { createContext, useContext, useState, useEffect } from 'react';

export type Brand = {
  id: string;
  name: string;
  logoUrl: string;
  mascotUrl?: string;
};

export const brands: Brand[] = [
  {
    id: 'otter-iq',
    name: 'Otter IQ',
    logoUrl: 'https://i.imgur.com/MscrBR9.png',
    mascotUrl: 'https://i.imgur.com/jdyGGMx.png',
  },
  {
    id: 'snapskill',
    name: 'SnapSkill',
    logoUrl: '/images/logo-alt.png',
    mascotUrl: '/images/snapskill-logo-icon.png',
  },
];

interface BrandingContextType {
  currentBrand: Brand;
  setBrandId: (id: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: React.ReactNode;
  initialBrandId?: string;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children, initialBrandId }) => {
  const getInitialBrand = () => {
    if (initialBrandId) {
      const brand = brands.find(b => b.id === initialBrandId);
      if (brand) return brand;
    }
    return brands[0];
  };

  const [currentBrand, setCurrentBrand] = useState<Brand>(getInitialBrand);

  const setBrandId = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand) {
      setCurrentBrand(brand);
    }
  };

  useEffect(() => {
     document.title = `${currentBrand.name} - Modernize Workforce Learning`;
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