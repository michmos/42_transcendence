// Routes plugin - Fully dynamic route loading
import { Router } from './router.js';
import { renderDynamicRoute, renderDynamicRouteWithParams } from './dynamic.js';

// Initialize router
const router = new Router();

// Fully dynamic route registration - NO hardcoding!
// Routes are automatically discovered and registered based on URL patterns and folder structure

// Fallback handler for all routes - dynamically discovers route files and patterns
router.setFallbackHandler((path: string) => {
  // Check if this path matches a dynamic route pattern (contains parameters)
  if (isDynamicRoutePath(path)) {
    handleDynamicRoutePath(path);
  } else {
    // Handle static routes
    handleStaticRoutePath(path);
  }
});

// Function to check if a path matches dynamic route patterns
function isDynamicRoutePath(path: string): boolean {
  const segments = path.split('/').filter((segment) => segment !== '');

  // Root path is always static
  if (segments.length === 0) return false;

  // Single segment paths are static routes (e.g., /about)
  if (segments.length === 1) return false;

  // Paths with 2+ segments could be dynamic (e.g., /info/123, /user/456)
  if (segments.length >= 2) {
    // Check if this looks like a dynamic route by checking if the second segment is a parameter
    // For now, assume any path with 2+ segments is potentially dynamic
    return true;
  }

  return false;
}

// Function to handle dynamic route paths
function handleDynamicRoutePath(path: string) {
  const segments = path.split('/').filter((segment) => segment !== '');

  if (segments.length >= 2) {
    // Extract parameters - everything after the base route name
    const params = segments.slice(1);
    renderDynamicRouteWithParams({ params, path });
  }
}

// Function to handle static route paths
function handleStaticRoutePath(path: string) {
  // Extract route name from path
  let routeName = '';
  if (path === '/' || path === '') {
    routeName = ''; // Root route
  } else {
    // Remove leading slash and use as route name
    routeName = path.substring(1);
    // Handle nested paths - use first segment as route name
    if (routeName.includes('/')) {
      const firstSegment = routeName.split('/')[0];
      routeName = firstSegment || '';
    }
  }

  // Try to render the dynamic route
  renderDynamicRoute(routeName);
}

// Handle navigation clicks - use event delegation for dynamically loaded content
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A' && target.hasAttribute('data-link')) {
    e.preventDefault();
    e.stopPropagation();
    const href = target.getAttribute('href');
    if (href) {
      router.navigate(href);
    }
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  router.handleRoute();
});

export default router;
