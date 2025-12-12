/**
 * Authentication API Client
 * Handles session management and logout
 */

export interface Session {
  uuid: string;
  role: 'ADMIN' | 'USER';
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
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}
