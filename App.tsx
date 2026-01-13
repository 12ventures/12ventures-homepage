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

// Prisma Health Demo Pages
import PrismaHub from './components/prismahealth/PrismaHub';
import GovernanceTool from './components/prismahealth/GovernanceTool';
import ModernLMS from './components/prismahealth/ModernLMS';
import TrainingEconomics from './components/prismahealth/TrainingEconomics';
import LearningLifecycle from './components/prismahealth/LearningLifecycle';
import MetricDashboard from './components/prismahealth/MetricDashboard';

const BrandLayout: React.FC<{ initialBrandId: string; children: React.ReactNode; showDevMenu?: boolean }> = ({ initialBrandId, children, showDevMenu = true }) => (
  <BrandingProvider initialBrandId={initialBrandId}>
    {children}
    {showDevMenu && <DevMenu />}
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

          {/* Prisma Health Demo Hub & Apps */}
          <Route
            path="/prismahealth"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <PrismaHub />
              </BrandLayout>
            }
          />
          <Route
            path="/prismahealth/governance-tool"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <GovernanceTool />
              </BrandLayout>
            }
          />
          <Route
            path="/prismahealth/modern-lms"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <ModernLMS />
              </BrandLayout>
            }
          />
          <Route
            path="/prismahealth/training-economics-calculator"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <TrainingEconomics />
              </BrandLayout>
            }
          />
          <Route
            path="/prismahealth/learning-lifecycle"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <LearningLifecycle />
              </BrandLayout>
            }
          />
          <Route
            path="/prismahealth/metric-dashboard"
            element={
              <BrandLayout initialBrandId="prisma-health" showDevMenu={false}>
                <MetricDashboard />
              </BrandLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </CalculatorModalProvider>
  );
};

export default App;
