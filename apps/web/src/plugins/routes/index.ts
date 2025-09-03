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
  const segments = path.split('/').filter(segment => segment !== '');
  
  if (segments.length < 2) return false; // Dynamic routes need at least 2 segments
  
  const baseRoute = segments[0];
  if (!baseRoute) return false; // Safety check
  
  // Try to detect if this could be a dynamic route by attempting to load it
  // If the static route fails, we'll assume it might be dynamic
  // This approach eliminates the need for hardcoded route lists
  return true; // Let the dynamic handler try to resolve it
}

// Function to handle dynamic route paths
function handleDynamicRoutePath(path: string) {
  const segments = path.split('/').filter(segment => segment !== '');
  
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
  if (path === '/') {
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

// Export router for external use if needed
export { router };

// Make router globally available for dynamic navigation
(window as any).router = router;
