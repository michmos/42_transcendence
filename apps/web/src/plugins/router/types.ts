export interface Route {
  path: string | RegExp;
  filePath: string;
  loader?: () => Promise<HTMLElement>;
}

export interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}
