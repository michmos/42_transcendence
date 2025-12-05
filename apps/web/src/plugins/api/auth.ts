/**
 * Authentication API Client
 * Handles session management and logout
 */

import UserAPI from './user.js';

export interface Session {
  uuid: string;
  role: 'ADMIN' | 'USER';
}

/**
 * Get current session from backend
 * Uses UserAPI.getMe() to fetch current user data
 * @returns Session object if logged in, null otherwise
 */
export async function getSession(): Promise<Session | null> {
  try {
    const user = await UserAPI.getMe();

    if (!user || !user.uuid) {
      return null;
    }

    return {
      uuid: user.uuid,
      role: (user.role as 'ADMIN' | 'USER') || 'USER',
    };
  } catch (error) {
    // Only log unexpected errors (not 401s which are handled gracefully)
    if (error instanceof Error && !error.message.includes('401')) {
      console.error('[getSession] Error:', error);
    }
    return null;
  }
}

/**
 * Logout current user
 * Clears session cookie and redirects to login
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to logout: ${response.status}`);
    }

    // Session cookie is cleared by backend
    // Frontend just needs to handle redirect
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if logout fails, we should still redirect to login
    throw error;
  }
}
