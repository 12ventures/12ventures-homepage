import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import NurseFeedback from './NurseFeedback';
import Pricing from './Pricing';
import CTA from './CTA';
import Footer from './Footer';
import LeadMagnetModal from './LeadMagnetModal';

const LandingPage: React.FC = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('lead_magnet_submitted');
    if (stored === 'true') {
      setHasSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (hasSubmitted) {
      hasTriggeredRef.current = true;
      return;
    }

    const target = ctaSectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setIsLeadModalOpen(true);
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.2,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasSubmitted]);

  const handleLeadSubmission = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lead_magnet_submitted', 'true');
    }
    setHasSubmitted(true);
  };

  const openLeadMagnet = () => {
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen selection:bg-brand-500/30 selection:text-brand-900">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <NurseFeedback />
        <Pricing />
        <div ref={ctaSectionRef}>
          <CTA onOpenLeadMagnet={openLeadMagnet} />
        </div>
      </main>
      <Footer />
      
      <LeadMagnetModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)}
        hasSubmitted={hasSubmitted}
        onSubmitted={handleLeadSubmission}
      />
    </div>
  );
};

export default LandingPage;

