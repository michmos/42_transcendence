// Simple SPA router class with dynamic route support
export class Router {
  private routes: { [key: string]: () => void } = {};
  private dynamicRoutes: { pattern: RegExp; handler: (params: any) => void }[] = [];
  private fallbackHandler?: (path: string) => void;
  
  constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
    // Remove DOMContentLoaded listener to prevent conflicts
  }
  
  addRoute(path: string, handler: () => void) {
    this.routes[path] = handler;
  }
  
  addDynamicRoute(pattern: string, handler: (params: any) => void) {
    // Convert pattern like '/info/:id' to regex
    const regexPattern = pattern.replace(/:([^/]+)/g, '([^/]+)');
    const regex = new RegExp(`^${regexPattern}$`);
    this.dynamicRoutes.push({ pattern: regex, handler });
  }
  
  setFallbackHandler(handler: (path: string) => void) {
    this.fallbackHandler = handler;
  }
  
  navigate(path: string) {
    history.pushState(null, '', path);
    this.handleRoute();
  }
  
  handleRoute() {
    const path = window.location.pathname;
    
    // First check exact routes
    const handler = this.routes[path];
    if (handler) {
      handler();
      return;
    }
    
    // Then check dynamic routes
    for (const dynamicRoute of this.dynamicRoutes) {
      const match = path.match(dynamicRoute.pattern);
      if (match) {
        // Extract parameters
        const params = match.slice(1); // Remove the full match, keep captured groups
        dynamicRoute.handler({ params, path });
        return;
      }
    }
    
    // Use fallback handler if available
    if (this.fallbackHandler) {
      this.fallbackHandler(path);
      return;
    }
    
    // Final fallback - show 404 or handle as needed
    console.warn(`No route handler found for path: ${path}`);
  }
}
