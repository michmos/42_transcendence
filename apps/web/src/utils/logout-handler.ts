/**
 * Shared logout handler
 * Can be used by all routes to handle logout consistently
 */

import { logout } from '../plugins/api/auth.js';
import { navigateTo } from './navigation.js';

/**
 * Handle user logout
 * Calls logout API which clears the cookie and returns to /
 */
export async function handleLogout(): Promise<void> {
  try {
    await logout();
    window.user = null;
    window.router.navigate('/');
  } catch (error) {
    console.error('Logout failed:', error);
    navigateTo('/');
  }
}
