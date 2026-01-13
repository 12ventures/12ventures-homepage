import React, { createContext, useContext, useState, useEffect } from 'react';

export type Brand = {
  id: string;
  name: string;
  subtitle?: string;
  logoUrl: string;
  mascotUrl?: string;
  mascotUrlLowRes?: string;
  wallpaperUrl?: string;
  wallpaperUrlLowRes?: string;
};

export const brands: Brand[] = [
  {
    id: '12-ventures',
    name: '12 Ventures',
    subtitle: 'The Home of Innovation',
    logoUrl: 'https://games.dreambox.gg/icons/12venturesLogoNew.png',
    mascotUrl: 'https://games.dreambox.gg/icons/12venturesLogoNew.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'otter-iq',
    name: 'Otter IQ',
    logoUrl: 'https://i.imgur.com/MscrBR9.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'otter-works',
    name: 'Otter Works',
    logoUrl: 'https://i.imgur.com/7wrLUzC.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'otterworks',
    name: 'OtterWorks',
    logoUrl: 'https://imgur.com/0yz7xSE.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'otterhealth',
    name: 'OtterHealth',
    logoUrl: 'https://i.imgur.com/2x1cku1.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'skill-surf',
    name: 'Skill Surf',
    logoUrl: 'https://i.imgur.com/mFS7Vig.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'iq-otter',
    name: 'IQ Otter',
    logoUrl: 'https://i.imgur.com/MscrBR9.png',
    mascotUrl: '/images/otter-mascot.png',
    mascotUrlLowRes: '/images/otter-mascot-lowres.png',
    wallpaperUrl: '/images/otter-wallpaper.png',
    wallpaperUrlLowRes: '/images/otter-wallpaper-lowres.png',
  },
  {
    id: 'snapskill',
    name: 'SnapSkill',
    logoUrl: '/images/logo-alt.png',
    mascotUrl: '/images/snapskill-logo-icon.png',
    wallpaperUrl: '/images/snapskill-wallpaper.png',
  },
  {
    id: 'snapskill2',
    name: 'SnapSkill 2',
    logoUrl: '/images/logo-alt.png',
    mascotUrl: '/images/snapskill-logo-icon.png',
    wallpaperUrl: '/images/snapskill-wallpaper2.png',
  },
  {
    id: 'prisma-health',
    name: 'Prisma Health',
    subtitle: 'Innovation in Healthcare Learning',
    logoUrl: '/logos/prisma-logo-primary.svg',
    mascotUrl: '/logos/prisma-logo-primary.svg', // Using logo as mascot for now
    wallpaperUrl: '/images/otter-wallpaper.png',
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
    return brands.find(b => b.id === '12-ventures') ?? brands[0];
  };

  const [currentBrand, setCurrentBrand] = useState<Brand>(getInitialBrand);

  const setBrandId = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand) {
      setCurrentBrand(brand);
    }
  };

  useEffect(() => {
     document.title = `${currentBrand.name} - ${currentBrand.subtitle ?? 'Modernize Workforce Learning'}`;
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