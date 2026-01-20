
/**
 * Server-Side Demo State Controller
 * 
 * This module acts as the source of truth for the application's mode.
 * It is effectively a singleton store on the "server" (API layer).
 */

// Initialize from env if present, otherwise default to false
let isDemoModeActive = false;

try {
  if (typeof process !== 'undefined' && process.env && process.env.DEMO_MODE === 'true') {
    isDemoModeActive = true;
  }
} catch (e) {
  // Ignore env errors
}

export const DemoState = {
  /**
   * Check if the server is currently in demo mode.
   */
  isActive: () => isDemoModeActive,

  /**
   * Enable demo mode (injects mock data).
   */
  enable: () => {
    isDemoModeActive = true;
    console.log('[API] Demo Mode Enabled');
  },

  /**
   * Disable demo mode (restores persistent storage).
   */
  disable: () => {
    isDemoModeActive = false;
    console.log('[API] Demo Mode Disabled');
  }
};
