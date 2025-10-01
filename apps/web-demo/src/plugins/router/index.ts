import { routes, dynamicRoutes } from '../../routes.js';

interface RouteMatch {
  route: any;
  params: Record<string, string>;
}

class SimpleRouter {
  private root: HTMLElement;
  private currentStyleElement: HTMLStyleElement | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.setupNavigation();
  }

  private setupNavigation() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => this.render());

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        this.navigate(new URL(link.href).pathname);
      }
    });
  }

  navigate(path: string) {
    window.history.pushState({}, '', path);
    this.render();
  }

  private matchRoute(path: string): RouteMatch | null {
    // Check static routes
    if (routes[path]) {
      return { route: routes[path], params: {} };
    }

    // Check dynamic routes
    for (const route of dynamicRoutes) {
      const match = path.match(route.pattern);
      if (match) {
        return { route, params: match.groups || {} };
      }
    }

    return null;
  }

  async render() {
    const path = window.location.pathname;
    const match = this.matchRoute(path);

    if (!match) {
      this.root.innerHTML = '<h1>404 Not Found</h1>';
      return;
    }

    try {
      // Load HTML
      const htmlModule = await match.route.html();
      const html = htmlModule.default || htmlModule;

      // Load CSS
      const cssModule = await match.route.css();
      const css = cssModule.default || cssModule;

      // Replace CSS
      if (this.currentStyleElement) {
        this.currentStyleElement.remove();
      }
      this.currentStyleElement = document.createElement('style');
      this.currentStyleElement.textContent = css;
      document.head.appendChild(this.currentStyleElement);

      // Replace HTML with parameter substitution
      let processedHtml = html;
      Object.entries(match.params).forEach(([key, value]) => {
        processedHtml = processedHtml.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value
        );
      });

      this.root.innerHTML = processedHtml;

      // Load and execute script
      const scriptModule = await match.route.script();
      if (scriptModule.default) {
        // Make params available globally
        (window as any).routeParams = match.params;
        scriptModule.default();
      }
    } catch (error) {
      console.error('Error loading route:', error);
      this.root.innerHTML = '<h1>Error loading page</h1>';
    }
  }
}

export { SimpleRouter };
