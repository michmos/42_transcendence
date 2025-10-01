// Route definitions with static imports
export const routes = {
  '/': {
    html: () => import('./routes/index.html?raw'),
    css: () => import('./routes/index.css?inline'),
    script: () => import('./routes/index.js'),
  },
  '/socket': {
    html: () => import('./routes/socket/index.html?raw'),
    css: () => import('./routes/socket/index.css?inline'),
    script: () => import('./routes/socket/index.js'),
  },
  '/login': {
    html: () => import('./routes/login/index.html?raw'),
    css: () => import('./routes/login/index.css?inline'),
    script: () => import('./routes/login/index.js'),
  },
  '/error': {
    html: () => import('./routes/error/index.html?raw'),
    css: () => import('./routes/error/index.css?inline'),
    script: () => import('./routes/error/index.js'),
  },
};

export const dynamicRoutes = [
  {
    pattern: /^\/info\/(?<id>[^/]+)$/,
    html: () => import('./routes/info[id]/index.html?raw'),
    css: () => import('./routes/info[id]/index.css?inline'),
    script: () => import('./routes/info[id]/index.js'),
  },
  {
    pattern: /^\/user\/(?<id>[^/]+)$/,
    html: () => import('./routes/user[id]/index.html?raw'),
    css: () => import('./routes/user[id]/index.css?inline'),
    script: () => import('./routes/user[id]/index.js'),
  },
];
