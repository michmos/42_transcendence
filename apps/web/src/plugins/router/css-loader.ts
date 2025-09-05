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
    console.log('🎨 CSS Loader: Attempting to load CSS for route:', filePath);

    // Check if CSS is already loaded for this route
    if (loadedRouteCss.has(filePath)) {
      console.log('🎨 CSS Loader: CSS already loaded for route:', filePath);
      return;
    }

    // Construct the CSS URL
    const cssUrl = filePath + '/index.css';
    console.log('🎨 CSS Loader: Fetching CSS from URL:', cssUrl);

    // Fetch the CSS content for the route
    const response = await fetch(cssUrl);
    console.log(
      '🎨 CSS Loader: Fetch response status:',
      response.status,
      response.statusText
    );

    if (!response.ok) {
      console.log(
        '🎨 CSS Loader: No CSS file found for route (this is okay):',
        filePath
      );
      return;
    }

    const responseText = await response.text();
    console.log('🎨 CSS Loader: Response text length:', responseText.length);

    // Extract CSS content from Vite's JavaScript wrapper
    const cssContent = extractCSSFromViteModule(responseText);
    if (!cssContent) {
      console.log('🎨 CSS Loader: Could not extract CSS content from response');
      return;
    }

    console.log(
      '🎨 CSS Loader: Extracted CSS content length:',
      cssContent.length
    );

    // Create a style element and inject the CSS
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-route', filePath);
    styleElement.textContent = cssContent;

    // Add to document head
    document.head.appendChild(styleElement);

    // Track the loaded CSS
    loadedRouteCss.add(filePath);
    cssElementMap.set(filePath, styleElement);

    console.log('✅ CSS Loader: CSS loaded successfully for route:', filePath);
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
  console.log('🧹 CSS Loader: Clearing all route CSS...');
  console.log(
    '🧹 CSS Loader: Currently loaded routes:',
    Array.from(loadedRouteCss)
  );

  // Remove all tracked CSS elements
  cssElementMap.forEach((styleElement) => {
    if (styleElement.parentNode) {
      console.log(
        '🧹 CSS Loader: Removing style element with data-route:',
        styleElement.getAttribute('data-route')
      );
      document.head.removeChild(styleElement);
    }
  });

  // Clear tracking maps
  cssElementMap.clear();
  loadedRouteCss.clear();

  console.log('🧹 CSS Loader: All route CSS cleared');
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
  console.log('🎯 CSS Loader: Setting route classes for:', filePath);

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

  console.log('🎯 CSS Loader: Added route class:', fullClassName);
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
