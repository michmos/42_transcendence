/**
 * Route Content Loader
 * Handles loading and caching of route HTML content
 * Load route HTML content with caching support
 */

export async function loadRouteHTML(
  filePath: string,
  params: Record<string, string> = {},
  cache: Map<string, HTMLElement>
): Promise<HTMLElement> {
  // Check cache first
  const cacheKey = filePath + JSON.stringify(params);
  const cachedElement = cache.get(cacheKey);
  if (cachedElement) {
    console.debug('Loading route from cache:', filePath);
    return cachedElement.cloneNode(true) as HTMLElement;
  }

  // Fetch the HTML content for the route
  try {
    const response = await fetch(filePath + '/index.html');
    if (!response.ok) {
      throw new Error(`Failed to load route: ${response.status}`);
    }
    const html = await response.text();
    const element = document.createElement('div');
    element.innerHTML = html;

    // Replace parameter placeholders in the HTML
    if (Object.keys(params).length > 0) {
      replaceParams(element, params);
    }

    // Cache the element for future use
    cache.set(cacheKey, element.cloneNode(true) as HTMLElement);

    return element;
  } catch (error) {
    console.error('Error loading route:', error);
    const errorElement = document.createElement('div');
    errorElement.textContent = 'Error loading page';
    return errorElement;
  }
}

/**
 * Replace {{param}} placeholders in the HTML with actual values
 */
export function replaceParams(
  element: HTMLElement,
  params: Record<string, string>
): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node;

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    let text = textNode.textContent || '';
    Object.entries(params).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    textNode.textContent = text;
  });
}

/**
 * Create a cache key for route content
 */
export function createCacheKey(
  filePath: string,
  params: Record<string, string>
): string {
  return filePath + JSON.stringify(params);
}
