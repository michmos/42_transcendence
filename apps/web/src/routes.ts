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
  '/game': {
    html: () => import('./routes/game/index.html?raw'),
    css: () => import('./routes/game/index.css?inline'),
    script: () => import('./routes/game/index.js'),
  },
  '/tournaments': {
    html: () => import('./routes/tournaments/index.html?raw'),
    css: () => import('./routes/tournaments/index.css?inline'),
    script: () => import('./routes/tournaments/index.js'),
  },
  '/profile': {
    html: () => import('./routes/profile/index.html?raw'),
    css: () => import('./routes/profile/index.css?inline'),
    script: () => import('./routes/profile/index.js'),
  },
  '/settings': {
    html: () => import('./routes/settings/index.html?raw'),
    css: () => import('./routes/settings/index.css?inline'),
    script: () => import('./routes/settings/index.js'),
  },
  '/waiting-room': {
    html: () => import('./routes/waiting-room/index.html?raw'),
    css: () => import('./routes/waiting-room/index.css?inline'),
    script: () => import('./routes/waiting-room/index.js'),
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
  {
    pattern: /^\/tournament\/(?<id>[^/]+)$/,
    html: () => import('./routes/tournament[id]/index.html?raw'),
    css: () => import('./routes/tournament[id]/index.css?inline'),
    script: () => import('./routes/tournament[id]/index.js'),
  },
  {
    pattern: /^\/round\/(?<roundId>[^/]+)$/,
    html: () => import('./routes/round[roundId]/index.html?raw'),
    css: () => import('./routes/round[roundId]/index.css?inline'),
    script: () => import('./routes/round[roundId]/index.js'),
  },
];
