/**
 * Navigation utility function to handle routing across the application.
 * Supports both window.navigateToRoute and window.router patterns.
 *
 * @param path - The path to navigate to (e.g., '/profile', '/tournament/123')
 */
export function navigateTo(path: string): void {
  if (window.navigateToRoute) {
    window.navigateToRoute(path);
  } else if (window.router) {
    window.router.navigate(path);
  } else {
    console.warn('No navigation method available. Falling back to window.location.');
    window.location.href = path;
  }
}

