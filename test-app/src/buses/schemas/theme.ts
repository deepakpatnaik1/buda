/**
 * Theme Bus Event Schemas
 * Defines contracts for all theme-related bus communications
 */

export interface ThemeEventSchemas {
  // Theme switching events
  'theme:switch-requested': {
    version: '1.0.0';
    payload: string; // theme name
    description: 'Request to switch to a specific theme';
  };

  'theme:current-theme-updated': {
    version: '1.0.0';
    payload: string; // theme name
    description: 'Notification that current theme has changed';
  };

  // Theme discovery events  
  'theme:request-available-themes': {
    version: '1.0.0';
    payload: null;
    description: 'Request list of available themes';
  };

  'theme:available-themes-updated': {
    version: '1.0.0';
    payload: string[]; // array of theme names
    description: 'Notification of available themes';
  };

  // Theme status events
  'theme:request-current-theme': {
    version: '1.0.0';
    payload: null;
    description: 'Request current active theme';
  };
}

// Publisher/Subscriber mapping for theme events
export const themeEventContracts = {
  'theme:switch-requested': {
    publishers: ['InputBar.svelte', 'ThemeSwitcher.svelte'],
    subscribers: ['ThemeWire.ts']
  },
  
  'theme:current-theme-updated': {
    publishers: ['ThemeWire.ts'],
    subscribers: ['InputBar.svelte', 'ThemeSwitcher.svelte']
  },
  
  'theme:request-available-themes': {
    publishers: ['InputBar.svelte', 'ThemeSwitcher.svelte'],
    subscribers: ['ThemeWire.ts']
  },
  
  'theme:available-themes-updated': {
    publishers: ['ThemeWire.ts'],
    subscribers: ['InputBar.svelte', 'ThemeSwitcher.svelte']
  },
  
  'theme:request-current-theme': {
    publishers: ['InputBar.svelte', 'ThemeSwitcher.svelte'],
    subscribers: ['ThemeWire.ts']
  }
};
