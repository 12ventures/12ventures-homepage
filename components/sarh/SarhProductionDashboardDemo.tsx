import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import OperatorDashboard from '../../pages/OperatorDashboard/OperatorDashboard';
import SarhPasswordGate from './SarhPasswordGate';
import '../../styles/operator-dashboard.css';

const PAGE_TITLE = 'SARH Voice AI · Production Dashboard (Video Demo)';
const SARH_PAGE_CLASS = 'sarh-dashboard-page';

function DashboardShell() {
  const { setPageThemeOverride } = useTheme();

  useEffect(() => {
    const previousTitle = document.title;
    setPageThemeOverride('dark');

    const id = window.setTimeout(() => {
      document.title = PAGE_TITLE;
    }, 0);

    return () => {
      window.clearTimeout(id);
      setPageThemeOverride(null);
      document.title = previousTitle;
    };
  }, [setPageThemeOverride]);

  return (
    <div className="sarh-dashboard-shell w-full overflow-x-hidden">
      <OperatorDashboard videoDemoMode />
    </div>
  );
}

/** Temporary route for product video: timed live call → completed history row. */
const SarhProductionDashboardDemo: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add(SARH_PAGE_CLASS);
    return () => document.documentElement.classList.remove(SARH_PAGE_CLASS);
  }, []);

  return (
    <SarhPasswordGate>
      <ThemeProvider>
        <DashboardShell />
      </ThemeProvider>
    </SarhPasswordGate>
  );
};

export default SarhProductionDashboardDemo;
