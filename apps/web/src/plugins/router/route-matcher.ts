import type { Route, RouteMatch } from './types.js';

/**
 * Route Matcher
 * Handles matching URL paths to registered routes
 * Match the current path to a registered route
 */

export function matchRoute(path: string, routes: Route[]): RouteMatch | null {
  for (const route of routes) {
    if (typeof route.path === 'string') {
      if (route.path === path) return { route, params: {} };
    } else {
      // RegExp route
      const match = path.match(route.path);
      if (match) {
        const params: Record<string, string> = {};

        // Extract named groups from regex
        if (match.groups) {
          Object.assign(params, match.groups);
        }

        // Return the matched route and extracted params
        return { route, params };
      }
    }
  }
  return null;
}

/**
 * Extract parameters from a route path using regex named groups
 */
export function extractRouteParams(
  path: string,
  routeRegex: RegExp
): Record<string, string> {
  const match = path.match(routeRegex);
  const params: Record<string, string> = {};

  if (match?.groups) {
    Object.assign(params, match.groups);
  }

  return params;
}
