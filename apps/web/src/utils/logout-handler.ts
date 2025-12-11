/**
 * Shared logout handler
 * Can be used by all routes to handle logout consistently
 */

import { logout } from '../plugins/api/auth.js';

/**
 * Handle user logout
 * Calls logout API which clears the cookie and returns to /
 */
export async function handleLogout(): Promise<void> {
  await logout();
  window.user = null;
  window.router.navigate('/login');
}
