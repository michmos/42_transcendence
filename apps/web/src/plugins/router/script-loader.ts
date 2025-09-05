/**
 * Route Script Loader
 * Handles loading and execution of route-specific JavaScript/TypeScript files
 */

/**
 * Load and execute route-specific script file
 */
export async function loadRouteScript(
  filePath: string,
  params: Record<string, string> = {}
): Promise<void> {
  // Try to load the script using fetch and dynamic execution
  // This approach is more flexible and doesn't require hardcoded routes
  await loadScriptWithDynamicImport(filePath, params);
}

/**
 * Load route script using dynamic import with proper error handling
 */
async function loadScriptWithDynamicImport(
  filePath: string,
  params: Record<string, string>
): Promise<void> {
  try {
    // First try to load as a module using fetch + dynamic script execution
    const scriptResponse = await fetch(filePath + '/index.js');
    if (scriptResponse.ok) {
      const scriptText = await scriptResponse.text();

      // Create a new script element and execute it
      const script = document.createElement('script');
      script.type = 'module';

      // Make params available to the script
      const scriptWithParams = `
        window.routeParams = ${JSON.stringify(params)};
        ${scriptText}
        
        // If the module exports an initRoute function, call it
        if (typeof initRoute === 'function') {
          initRoute();
        }
      `;

      script.textContent = scriptWithParams;

      // Set up cleanup and execution
      script.onload = () => {
        console.debug('Route script loaded successfully:', filePath);
        setTimeout(() => {
          if (script.parentNode) {
            document.head.removeChild(script);
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.debug('Error executing route script:', error);
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };

      // Make params available globally before adding script
      console.debug('Setting routeParams:', params);
      (window as unknown as Record<string, unknown>).routeParams = params;

      document.head.appendChild(script);
      return;
    }
  } catch (error) {
    console.debug('Failed to load route script:', filePath, error);
  }

  // If script loading fails, that's okay - not all routes need scripts
  console.debug('No script found for route (this is okay):', filePath);
}
