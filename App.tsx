import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import NurseFeedback from './components/NurseFeedback';
import Pricing from './components/Pricing';
import CTA from './components/CTA';
import Footer from './components/Footer';
import { BrandingProvider } from './contexts/BrandingContext';
import DevMenu from './components/DevMenu';

const App: React.FC = () => {
  return (
    <BrandingProvider>
      <div className="min-h-screen selection:bg-brand-500/30 selection:text-brand-900">
        <Header />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <Testimonials />
          <NurseFeedback />
          <Pricing />
          <CTA />
        </main>
        <Footer />
        <DevMenu />
      </div>
    </BrandingProvider>
  );
};

export default App;