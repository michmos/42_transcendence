// Dynamic route loader - handles all routes dynamically
import { renderContent } from './utils.js';

// Define the expected shape of a route module
interface RouteModule {
  initRoute?: (params?: Record<string, unknown>) => void;
}

// Import all route modules at build time using Vite's glob import
const routeModules = import.meta.glob('/src/routes/**/index.ts', {
  eager: false,
});

export async function renderDynamicRoute(routePath: string) {
  try {
    let htmlPath: string;
    let cssPath: string;
    let moduleKey: string;

    // Determine file paths based on route
    if (routePath === '') {
      // Root route - files are directly in /src/routes/
      htmlPath = '/src/routes/index.html';
      cssPath = '/src/routes/index.css';
      moduleKey = '/src/routes/index.ts';
    } else {
      // Subfolder routes - files are in /src/routes/{routePath}/
      htmlPath = `/src/routes/${routePath}/index.html`;
      cssPath = `/src/routes/${routePath}/index.css`;
      moduleKey = `/src/routes/${routePath}/index.ts`;
    }

    // Load HTML content
    const htmlResponse = await fetch(htmlPath);
    if (!htmlResponse.ok) {
      throw new Error(`Failed to load HTML for route: ${routePath || 'root'}`);
    }
    const content = await htmlResponse.text();

    // Clean up any existing route-specific styles first
    const existingRouteStyles = document.querySelectorAll('style[data-route]');
    existingRouteStyles.forEach((style) => style.remove());

    // Try to load and inject CSS if it exists
    try {
      const cssResponse = await fetch(cssPath);
      if (cssResponse.ok) {
        const cssContent = await cssResponse.text();
        // Create style tag for this route and append it to head (after main CSS)
        const style = document.createElement('style');
        style.setAttribute('data-route', routePath || 'home');
        style.textContent = cssContent;
        // Append to head to ensure it comes after the main CSS link tag
        document.head.appendChild(style);
      }
    } catch {
      // CSS file doesn't exist, that's ok
      console.log(`No CSS file found for route: ${routePath || 'root'}`);
    }

    // Render the HTML content to the page
    renderContent(content);

    // Check if the route module exists in our glob imports
    const routeModuleLoader = routeModules[moduleKey];
    if (typeof routeModuleLoader === 'function') {
      const routeModule = (await routeModuleLoader()) as RouteModule;

      // Call route initialization if it exists
      if (
        routeModule &&
        routeModule.initRoute &&
        typeof routeModule.initRoute === 'function'
      ) {
        routeModule.initRoute();
      }
    } else {
      console.log(`No TypeScript file found for route: ${routePath || 'root'}`);
    }
  } catch (error) {
    console.error(
      `Error loading route content for ${routePath || 'root'}:`,
      error
    );
    renderContent(`<h1>Error loading ${routePath || 'home'} page</h1>`);
  }
}

// Dynamic route handler with parameters - auto-detects [param] folder patterns
export async function renderDynamicRouteWithParams(routeInfo: {
  params: string[];
  path: string;
}) {
  try {
    const { params, path } = routeInfo;

    // Extract the base route name from the path
    const pathSegments = path.split('/').filter((segment) => segment !== '');

    // If this is the root path, it should not be handled as a dynamic route
    if (pathSegments.length === 0) {
      console.log(
        'Root path detected in dynamic handler, falling back to static route'
      );
      renderDynamicRoute('');
      return;
    }

    const baseRouteName = pathSegments[0]; // e.g., "info" from "/info/123"

    if (!baseRouteName) {
      console.error('No base route name found for path:', path);
      renderContent(`<h1>Page Not Found</h1><p>Invalid route path.</p>`);
      return;
    }

    // Try to find a matching dynamic folder (with [param] pattern)
    const dynamicFolderName = `${baseRouteName}[id]`; // Convention: routename[id]

    // Determine file paths for dynamic route
    const htmlPath = `/src/routes/${dynamicFolderName}/index.html`;
    const cssPath = `/src/routes/${dynamicFolderName}/index.css`;
    const moduleKey = `/src/routes/${dynamicFolderName}/index.ts`;

    // Load HTML content
    const htmlResponse = await fetch(htmlPath);
    if (!htmlResponse.ok) {
      // If dynamic route doesn't exist, fall back to static route handling
      console.log(
        `Dynamic route ${dynamicFolderName} not found, trying static route`
      );
      renderDynamicRoute(baseRouteName);
      return;
    }
    const content = await htmlResponse.text();

    // Clean up any existing route-specific styles first
    const existingRouteStyles = document.querySelectorAll('style[data-route]');
    existingRouteStyles.forEach((style) => style.remove());

    // Try to load and inject CSS if it exists
    try {
      const cssResponse = await fetch(cssPath);
      if (cssResponse.ok) {
        const cssContent = await cssResponse.text();
        // Create style tag for this route and append it to head (after main CSS)
        const style = document.createElement('style');
        style.setAttribute('data-route', baseRouteName);
        style.textContent = cssContent;
        // Append to head to ensure it comes after the main CSS link tag
        document.head.appendChild(style);
      }
    } catch {
      console.log(`No CSS file found for dynamic route: ${dynamicFolderName}`);
    }

    // Render the content first
    renderContent(content);

    // Try to load and execute TypeScript if it exists (after rendering)
    try {
      // Check if the route module exists in our glob imports
      if (routeModules[moduleKey]) {
        const routeModule = (await routeModules[moduleKey]()) as RouteModule;

        // Call route initialization if it exists, passing parameters
        if (
          routeModule &&
          routeModule.initRoute &&
          typeof routeModule.initRoute === 'function'
        ) {
          // Create parameter object based on convention
          const routeParams = { id: params[0] }; // First param is always 'id' by convention
          routeModule.initRoute(routeParams);
        }
      } else {
        console.log(
          `No TypeScript file found for dynamic route: ${dynamicFolderName}`
        );
      }
    } catch (tsError) {
      console.error(
        `Error loading TypeScript for dynamic route: ${dynamicFolderName}`,
        tsError
      );
    }
  } catch (error) {
    console.error(`Error loading dynamic route content:`, error);
    renderContent(
      `<h1>Page Not Found</h1><p>Could not find route files for this path.</p>`
    );
  }
}
