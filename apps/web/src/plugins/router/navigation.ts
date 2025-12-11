/**
 * Navigation Handler
 * Handles browser navigation events and link interception
 */

export type NavigationHandler = (_path: string) => void;

/**
 * Set up navigation event listeners
 */
export function setupNavigation(
  renderCallback: () => void,
  navigateCallback: NavigationHandler
): void {
  // Handle back/forward navigation
  window.addEventListener('popstate', () => renderCallback());

  // Intercept all clicks on links with data-link attribute
  document.addEventListener('click', (e) => {
    // Get the clicked target
    const target = e.target as HTMLElement;

    // Get the closest anchor element with data-link attribute
    const link = target.closest('a[data-link]') as HTMLAnchorElement;

    // If it's a link with data-link, handle navigation
    if (link) {
      // Prevent default link behavior
      e.preventDefault();
      // if it's a href link with data-link, handle navigation
      const href = link.getAttribute('href');

      // Navigate to the href if it exists
      if (href) {
        navigateCallback(href);
      }
    }
  });

  // Provide a global navigation function for programmatic navigation
  // This replaces the need to override window.location.href
  window.navigateToRoute = (path: string) => {
    console.log('🔄 Programmatic navigation to:', path);
    navigateCallback(path);
  };
}

/**
 * Navigate to a new path
 */
export function navigateTo(path: string, renderCallback: () => void): void {
  history.pushState({}, '', path);
  renderCallback();
}

/**
 * Get the current pathname
 */
export function getCurrentPath(): string {
  return window.location.pathname;
}
