/**
 * Handle user logout
 * Calls logout API which clears the cookie and returns to /
 */
export async function handleLogout(): Promise<void> {
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

  window.user = null;
  window.router.navigate('/login');
}
