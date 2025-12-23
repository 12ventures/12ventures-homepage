import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import ROICalculatorModal from '../components/ROICalculatorModal';

type CalculatorModalValue = {
  openCalculatorModal: () => void;
};

const CalculatorModalContext = createContext<CalculatorModalValue | undefined>(undefined);

export const CalculatorModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCalculatorModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCalculatorModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ openCalculatorModal }), [openCalculatorModal]);

  return (
    <CalculatorModalContext.Provider value={value}>
      {children}
      <ROICalculatorModal isOpen={isOpen} onClose={closeCalculatorModal} />
    </CalculatorModalContext.Provider>
  );
};

export const useCalculatorModal = () => {
  const context = useContext(CalculatorModalContext);
  if (!context) {
    throw new Error('useCalculatorModal must be used within a CalculatorModalProvider');
  }
  return context;
};

