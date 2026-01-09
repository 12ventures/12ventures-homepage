import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandingProvider } from './contexts/BrandingContext';
import { CalculatorModalProvider } from './contexts/CalculatorModalContext';
import VenturesHome from './components/VenturesHome';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import OtterWiki from './components/OtterWiki';
import RoyceSlides from './components/RoyceSlides';
import DevMenu from './components/DevMenu';

const BrandLayout: React.FC<{ initialBrandId: string; children: React.ReactNode }> = ({ initialBrandId, children }) => (
  <BrandingProvider initialBrandId={initialBrandId}>
    {children}
    <DevMenu />
  </BrandingProvider>
);

const App: React.FC = () => {
  return (
    <CalculatorModalProvider>
      <BrowserRouter>
        <Routes>
          {/* 12Ventures homepage */}
          <Route
            path="/"
            element={
              <BrandLayout initialBrandId="12-ventures">
                <VenturesHome />
              </BrandLayout>
            }
          />

          {/* Otter IQ landing page */}
          <Route
            path="/otter"
            element={
              <BrandLayout initialBrandId="otterworks">
                <LandingPage />
              </BrandLayout>
            }
          />

          {/* SnapSkill landing page */}
          <Route
            path="/snapskill"
            element={
              <BrandLayout initialBrandId="snapskill">
                <LandingPage />
              </BrandLayout>
            }
          />

          {/* SnapSkill 2 landing page */}
          <Route
            path="/snapskill2"
            element={
              <BrandLayout initialBrandId="snapskill2">
                <LandingPage />
              </BrandLayout>
            }
          />

          {/* Privacy Policy */}
          <Route
            path="/privacy"
            element={
              <BrandLayout initialBrandId="otterworks">
                <PrivacyPolicy />
              </BrandLayout>
            }
          />

          {/* Terms of Service */}
          <Route
            path="/terms"
            element={
              <BrandLayout initialBrandId="otterworks">
                <TermsOfService />
              </BrandLayout>
            }
          />

          {/* OtterWorks landing page (same as /otter) */}
          <Route
            path="/otterworks"
            element={
              <BrandLayout initialBrandId="otterworks">
                <LandingPage />
              </BrandLayout>
            }
          />

          {/* Otter Wiki (legacy path) */}
          <Route
            path="/otterwiki"
            element={<OtterWiki />}
          />

          {/* OtterWorks Wiki */}
          <Route
            path="/otterworks/wiki"
            element={<OtterWiki />}
          />

          {/* Royce Slides */}
          <Route
            path="/royce"
            element={<RoyceSlides />}
          />
        </Routes>
      </BrowserRouter>
    </CalculatorModalProvider>
  );
};

export default App;
