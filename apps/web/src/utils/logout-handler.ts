/**
 * Shared logout handler
 * Can be used by all routes to handle logout consistently
 */

import { logout } from '../plugins/api/auth.js';
import { navigateTo } from './navigation.js';
import { clearSession } from './auth-state.js';

/**
 * Handle user logout
 * Calls logout API which clears the cookie and returns to /
 */
export async function handleLogout(): Promise<void> {
  try {
    // Clear session from memory immediately to prevent race conditions
    clearSession();
    // Call the logout API - it will clear the cookie and return to /
    await logout();
    navigateTo('/');
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear session and redirect to / even if logout API call fails
    clearSession();
    navigateTo('/');
  }
}
