/**
 * Shared logout handler
 * Can be used by all routes to handle logout consistently
 */

import { logout } from '../plugins/api/auth.js';
import { clearSession } from './auth-state.js';
import { navigateTo } from './navigation.js';

/**
 * Handle user logout
 * Calls logout API, clears session, and redirects to login
 */
export async function handleLogout(): Promise<void> {
  try {
    await logout();
    clearSession();
    navigateTo('/login');
  } catch (error) {
    console.error('Logout failed:', error);
    // Still redirect to login even if logout API call fails
    clearSession();
    navigateTo('/login');
  }
}






