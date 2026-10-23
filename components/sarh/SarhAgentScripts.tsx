import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import AgentScripts from '../../pages/AgentScripts/AgentScripts';
import SarhPasswordGate from './SarhPasswordGate';
import '../../styles/operator-dashboard.css';

const PAGE_TITLE = 'SARH Voice AI · Phone Scripts';
const SARH_PAGE_CLASS = 'sarh-dashboard-page';

/**
 * Script editor route is hidden from production builds until it's ready for
 * the hospital: available in `vite dev`, or with VITE_ENABLE_SCRIPT_EDITOR=true.
 */
export const SCRIPT_EDITOR_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SCRIPT_EDITOR === 'true';

function ScriptsShell() {
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

  return <AgentScripts />;
}

const SarhAgentScripts: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add(SARH_PAGE_CLASS);
    return () => document.documentElement.classList.remove(SARH_PAGE_CLASS);
  }, []);

  return (
    <SarhPasswordGate title="Phone Scripts">
      <ThemeProvider>
        <ScriptsShell />
      </ThemeProvider>
    </SarhPasswordGate>
  );
};

export default SarhAgentScripts;
