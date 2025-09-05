import type { Route } from './types.js';
import { matchRoute } from './route-matcher.js';
import { loadRouteHTML } from './content-loader.js';
import { loadRouteScript } from './script-loader.js';
import {
  loadRouteCSS,
  clearAllRouteCSS,
  setRouteClasses,
} from './css-loader.js';
import { setupNavigation, navigateTo, getCurrentPath } from './navigation.js';

/**
 * Simple Router
 * A lightweight SPA router with support for dynamic routes, caching, and asset loading
 */
class SimpleRouter {
  private routes: Route[] = [];
  private root: HTMLElement;
  private cache = new Map<string, HTMLElement>();

  constructor(root: HTMLElement) {
    this.root = root;

    // Set up navigation handling
    setupNavigation(
      () => this.render(),
      (path: string) => this.navigate(path)
    );
  }

  /**
   * Register a new route
   */
  add(path: string | RegExp, filePath: string): void {
    this.routes.push({ path, filePath });
  }

  /**
   * Load route scripts after HTML is in the DOM
   */
  private async loadRouteScripts(
    filePath: string,
    params: Record<string, string> = {}
  ): Promise<void> {
    await loadRouteScript(filePath, params);
  }

  /**
   * Navigate to a new path
   */
  navigate(path: string): void {
    navigateTo(path, () => this.render());
  }

  /**
   * Render the current route
   */
  async render(): Promise<void> {
    const path = getCurrentPath();
    console.log('🔍 Router.render() called for path:', path);
    console.log(
      '🔍 Available routes:',
      this.routes.map((r) => ({ path: r.path, filePath: r.filePath }))
    );

    const match = matchRoute(path, this.routes);
    console.log('🔍 Route match result:', match);

    // If a route matches, load and display it
    if (match) {
      try {
        console.log(
          '🚀 Loading route:',
          match.route.filePath,
          'with params:',
          match.params
        );

        // STEP 1: Clear any existing route CSS FIRST to prevent conflicts
        console.log('🧹 Clearing all existing CSS...');
        clearAllRouteCSS();

        // STEP 2: Small delay to ensure CSS clearing completes
        await new Promise((resolve) => setTimeout(resolve, 10));

        // STEP 3: Load CSS with proper classes
        console.log('🎨 Loading CSS for route:', match.route.filePath);
        await loadRouteCSS(match.route.filePath);

        // STEP 4: Load HTML content (this may come from cache)
        console.log('📄 Loading HTML for route:', match.route.filePath);
        const element = await loadRouteHTML(
          match.route.filePath,
          match.params,
          this.cache
        );

        // STEP 5: Clear the root element and insert new content
        console.log('🔄 Inserting content into DOM...');
        this.root.innerHTML = '';
        this.root.appendChild(element);

        // STEP 6: Set proper CSS classes for the route
        console.log('🎯 Setting route classes...');
        setRouteClasses(match.route.filePath);

        // STEP 7: Load scripts AFTER HTML is in the DOM
        console.log('📜 Loading scripts for route:', match.route.filePath);
        await this.loadRouteScripts(match.route.filePath, match.params);

        console.log('✅ Route fully loaded:', match.route.filePath);
      } catch (error) {
        console.error('Error rendering route:', error);
        this.root.textContent = 'Error loading page';
      }
    } else {
      // Clear CSS for 404 case too
      clearAllRouteCSS();
      this.root.textContent = '404 Not Found';
    }
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Clear the route cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export { SimpleRouter };
export type { Route } from './types.js';
export {
  loadRouteCSS,
  clearAllRouteCSS,
  setRouteClasses,
  removeRouteCSS,
  getLoadedCSSRoutes,
  isCSSLoadedForRoute,
  preloadRouteCSS,
} from './css-loader.js';
