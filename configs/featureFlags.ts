/**
 * Experimental Feature Flags Configuration
 * 
 * Features marked as experimental are only available when VITE_ENVIRONMENT === "staging"
 * In production, these features are hidden/disabled.
 */

export const EXPERIMENTAL_FEATURES = {
  // Navigation items
  NAV_EXPERT_CHAT: 'nav_expert_chat',
  NAV_CORE_INSIGHTS: 'nav_core_insights',
  NAV_CREATE: 'nav_create',
  NAV_EPIC_EHR: 'nav_epic_ehr',
  NAV_EPIC_ALERTS: 'nav_epic_alerts',
  NAV_CONTINUOUS_LEARNING: 'nav_continuous_learning',
  NAV_GODMODE: 'nav_godmode',
  
  // Layout options
  LAYOUT_SIDE_NAV: 'layout_side_nav',
  
  // Theme modes
  THEME_MODERN_MODE: 'theme_modern_mode',
  
  // Routes/Pages
  PAGE_EXPERT_CHAT: 'page_expert_chat',
  PAGE_CORE_INSIGHTS: 'page_core_insights',
  PAGE_CREATE: 'page_create',
  PAGE_EPIC_EHR: 'page_epic_ehr',
  PAGE_EPIC_ALERTS: 'page_epic_alerts',
  PAGE_CONTINUOUS_LEARNING: 'page_continuous_learning',
  PAGE_GODMODE: 'page_godmode',
  
  // Insights tabs
  INSIGHTS_EXPERTS_TAB: 'insights_experts_tab',
  INSIGHTS_CONTINUOUS_LEARNING_TAB: 'insights_continuous_learning_tab',
  
  // Page backgrounds
  DISCOVER_PAGE_BACKGROUND: 'discover_page_background',

  // Content features
  CONTENT_SIMPLE_COPILOT: 'content_simple_copilot',
  CONTENT_CONTINUOUS_IMPROVEMENT: 'content_continuous_improvement',
  CONTENT_MISSION_SYSTEM: 'content_mission_system',
} as const;

export type ExperimentalFeature = typeof EXPERIMENTAL_FEATURES[keyof typeof EXPERIMENTAL_FEATURES];

/**
 * Check if a feature is enabled based on environment
 * Features are only enabled when VITE_ENVIRONMENT === "staging"
 * @param featureId - The feature ID to check (currently unused, reserved for future per-feature gating)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Admin experimental features override
const ADMIN_EXPERIMENTAL_OVERRIDE_KEY = 'snapskill_admin_experimental_override';

const getAdminExperimentalOverride = (): boolean | null => {
  try {
    const override = localStorage.getItem(ADMIN_EXPERIMENTAL_OVERRIDE_KEY);
    return override ? JSON.parse(override) : null;
  } catch (error) {
    console.error('Error reading admin experimental override:', error);
    return null;
  }
};

const setAdminExperimentalOverride = (enabled: boolean): void => {
  try {
    localStorage.setItem(ADMIN_EXPERIMENTAL_OVERRIDE_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error saving admin experimental override:', error);
  }
};

export const isFeatureEnabled = (featureId: ExperimentalFeature | string): boolean => {
  const env = import.meta.env.VITE_ENVIRONMENT;

  // Check for admin override first (admins can override env settings)
  const adminOverride = getAdminExperimentalOverride();
  if (adminOverride !== null) {
    return adminOverride;
  }

  // Fall back to environment-based detection
  return env === 'staging';
};

// Admin-specific functions for experimental features override
export const getAdminExperimentalOverrideValue = (): boolean | null => {
  return getAdminExperimentalOverride();
};

export const setAdminExperimentalOverrideValue = (enabled: boolean): void => {
  setAdminExperimentalOverride(enabled);
};

/**
 * Check if multiple features are enabled (all must be enabled)
 */
export const areFeaturesEnabled = (...featureIds: (ExperimentalFeature | string)[]): boolean => {
  return featureIds.every(id => isFeatureEnabled(id));
};

/**
 * Get the current environment
 */
export const getEnvironment = (): string => {
  return import.meta.env.VITE_ENVIRONMENT || 'production';
};

/**
 * Check if we're in staging environment
 */
export const isStaging = (): boolean => {
  return getEnvironment() === 'staging';
};

