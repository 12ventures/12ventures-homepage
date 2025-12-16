import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandingProvider } from './contexts/BrandingContext';
import VenturesHome from './components/VenturesHome';
import LandingPage from './components/LandingPage';
import DevMenu from './components/DevMenu';

const BrandLayout: React.FC<{ initialBrandId: string; children: React.ReactNode }> = ({ initialBrandId, children }) => (
  <BrandingProvider initialBrandId={initialBrandId}>
    {children}
    <DevMenu />
  </BrandingProvider>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 12Ventures homepage */}
        <Route
          path="/"
          element={
            <BrandLayout initialBrandId="otter-iq">
              <VenturesHome />
            </BrandLayout>
          }
        />

        {/* Otter IQ landing page */}
        <Route
          path="/otter"
          element={
            <BrandLayout initialBrandId="otter-iq">
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;
