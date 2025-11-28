/**
 * Authentication API Client
 * Handles session management and logout
 */

import { fetchSessionData } from 'fastify-oauth/client';

export interface Session {
  uuid: string;
  role: 'ADMIN' | 'USER';
}

/**
 * Get current session from backend
 * Uses fastify-oauth/client's fetchSessionData which is the official way
 * @returns Session object if logged in, null otherwise
 */
export async function getSession(): Promise<Session | null> {
  try {
    const user = await fetchSessionData();

    if (!user) {
      return null;
    }

    // fetchSessionData returns user object with uuid
    // We need to get the role from somewhere - might need to call /user/me or another endpoint
    // For now, assume USER role (can be enhanced later)
    return {
      uuid: user.uuid,
      role: 'USER' as const, // TODO: Fetch actual role from backend if needed
    };
  } catch (error) {
    console.error('Error fetching session:', error);
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
