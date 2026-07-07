import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isFeatureEnabled, EXPERIMENTAL_FEATURES } from '../configs/featureFlags';

type Theme = 'light' | 'dark' | 'modern';
type PageThemeOverride = 'light' | 'dark' | null;

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: Theme;
  pageThemeOverride: PageThemeOverride;
  setTheme: (theme: Theme) => void;
  setPageThemeOverride: (theme: PageThemeOverride) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Check if modern mode is enabled
  const modernModeEnabled = isFeatureEnabled(EXPERIMENTAL_FEATURES.THEME_MODERN_MODE);
  const availableThemes: Theme[] = modernModeEnabled ? ['light', 'dark', 'modern'] : ['light', 'dark'];

  // Check localStorage for saved theme preference, default to light mode
  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && availableThemes.includes(savedTheme)) {
      return savedTheme;
    }

    // If saved theme is modern but not available, fallback to light
    if (savedTheme === 'modern' && !modernModeEnabled) {
      return 'light';
    }

    // Default to light mode instead of checking system preference
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [pageThemeOverride, setPageThemeOverride] = useState<PageThemeOverride>(null);

  const effectiveTheme = useMemo(
    () => (pageThemeOverride ?? theme) as Theme,
    [pageThemeOverride, theme],
  );

  // Apply effective theme to document (page override does not touch localStorage)
  useEffect(() => {
    const validTheme = availableThemes.includes(effectiveTheme) ? effectiveTheme : 'light';

    document.documentElement.setAttribute('data-theme', validTheme);

    if (validTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme, availableThemes]);

  // Persist user preference only when their chosen theme changes
  useEffect(() => {
    const validTheme = availableThemes.includes(theme) ? theme : 'light';

    if (validTheme !== theme) {
      setTheme(validTheme);
      return;
    }

    localStorage.setItem('theme', validTheme);
  }, [theme, availableThemes]);

  // Handle theme changes - prevent setting modern mode if not enabled
  const handleSetTheme = (newTheme: Theme) => {
    if (availableThemes.includes(newTheme)) {
      setTheme(newTheme);
    } else if (newTheme === 'modern' && !modernModeEnabled) {
      // Silently fallback to light if trying to set modern mode when disabled
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        pageThemeOverride,
        setTheme: handleSetTheme,
        setPageThemeOverride,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
