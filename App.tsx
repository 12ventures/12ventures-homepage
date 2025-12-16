import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandingProvider } from './contexts/BrandingContext';
import VenturesHome from './components/VenturesHome';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 12Ventures homepage */}
        <Route path="/" element={<VenturesHome />} />
        
        {/* Otter IQ landing page */}
        <Route 
          path="/otter" 
          element={
            <BrandingProvider initialBrandId="otter-iq">
              <LandingPage />
            </BrandingProvider>
          } 
        />
        
        {/* SnapSkill landing page */}
        <Route 
          path="/snapskill" 
          element={
            <BrandingProvider initialBrandId="snapskill">
              <LandingPage />
            </BrandingProvider>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
