/**
 * Route CSS Loader
 * Handles loading and injection of route-specific CSS files
 */

// Keep track of currently loaded route CSS
const loadedRouteCss = new Set<string>();
const cssElementMap = new Map<string, HTMLStyleElement>();

/**
 * Load and inject route-specific CSS file
 */
export async function loadRouteCSS(filePath: string): Promise<void> {
  try {
    // Check if CSS is already loaded for this route
    if (loadedRouteCss.has(filePath)) {
      console.log('🎨 CSS Loader: CSS already loaded for route:', filePath);
      return;
    }

    // Construct the CSS URL
    const cssUrl = filePath + '/index.css';

    // Fetch the CSS content for the route
    const response = await fetch(cssUrl);

    if (!response.ok) {
      return;
    }

    const responseText = await response.text();

    // Extract CSS content from Vite's JavaScript wrapper
    const cssContent = extractCSSFromViteModule(responseText);
    if (!cssContent) return;

    // Create a style element and inject the CSS
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-route', filePath);
    styleElement.textContent = cssContent;

    // Add to document head
    document.head.appendChild(styleElement);

    // Track the loaded CSS
    loadedRouteCss.add(filePath);
    cssElementMap.set(filePath, styleElement);
  } catch (error) {
    console.error(
      '🎨 CSS Loader: Failed to load CSS for route:',
      filePath,
      error
    );
  }
}

/**
 * Extract CSS content from Vite's JavaScript module wrapper
 */
function extractCSSFromViteModule(jsContent: string): string | null {
  try {
    // Look for the __vite__css variable which contains the actual CSS
    const cssMatch = jsContent.match(/const __vite__css = "(.*?)"/s);
    if (cssMatch && cssMatch[1]) {
      // Unescape the JavaScript string (handle \n, \", etc.)
      return cssMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    // Fallback: try to extract CSS from any quoted string that looks like CSS
    const fallbackMatch = jsContent.match(
      /"([^"]*(?:background|color|margin|padding)[^"]*)"/
    );
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    return null;
  } catch (error) {
    console.error(
      '🎨 CSS Loader: Error extracting CSS from Vite module:',
      error
    );
    return null;
  }
}

/**
 * Remove CSS for a specific route
 */
export function removeRouteCSS(filePath: string): void {
  const styleElement = cssElementMap.get(filePath);
  if (styleElement && styleElement.parentNode) {
    document.head.removeChild(styleElement);
    cssElementMap.delete(filePath);
    loadedRouteCss.delete(filePath);
    console.log('🧹 CSS Loader: CSS removed for route:', filePath);
  }
}

/**
 * Clear all route-specific CSS
 */
export function clearAllRouteCSS(): void {
  // Remove all tracked CSS elements
  cssElementMap.forEach((styleElement) => {
    if (styleElement.parentNode) document.head.removeChild(styleElement);
  });

  // Clear tracking maps
  cssElementMap.clear();
  loadedRouteCss.clear();
}

/**
 * Get all currently loaded CSS routes
 */
export function getLoadedCSSRoutes(): string[] {
  return Array.from(loadedRouteCss);
}

/**
 * Check if CSS is loaded for a specific route
 */
export function isCSSLoadedForRoute(filePath: string): boolean {
  return loadedRouteCss.has(filePath);
}

/**
 * Set route-specific CSS classes on the body element
 * This allows for route-specific styling isolation
 */
export function setRouteClasses(filePath: string): void {
  // Remove any existing route classes
  document.body.classList.forEach((className) => {
    if (className.startsWith('route-')) {
      console.log('🎯 CSS Loader: Removing existing route class:', className);
      document.body.classList.remove(className);
    }
  });

  // Generate a route class name from the file path
  const routeClassName = generateRouteClassName(filePath);
  const fullClassName = `route-${routeClassName}`;
  document.body.classList.add(fullClassName);
}

/**
 * Generate a CSS-safe class name from a route file path
 */
function generateRouteClassName(filePath: string): string {
  // Remove leading slash and convert to kebab-case
  return filePath
    .replace(/^\//, '') // Remove leading slash
    .replace(/\[([^\]]+)\]/g, '$1') // Convert [param] to param
    .replace(/[/\s]+/g, '-') // Replace slashes and spaces with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove non-alphanumeric chars except hyphens
    .toLowerCase();
}

/**
 * Preload CSS for multiple routes (for performance optimization)
 */
export async function preloadRouteCSS(filePaths: string[]): Promise<void> {
  const loadPromises = filePaths.map((filePath) => loadRouteCSS(filePath));
  await Promise.allSettled(loadPromises);
  console.log('🚀 CSS preloaded for routes:', filePaths);
}
