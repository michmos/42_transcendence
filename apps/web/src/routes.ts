// Route definitions with static imports
export const routes = {
  '/': {
    html: () => import('./index.html?raw'),
    css: () => import('./index.css?inline'),
    script: () => import('./routes/index.js'),
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
  // TODO: Enable these routes when needed or remove them entirely
  // '/error': {
  //   html: () => import('./routes/error/index.html?raw'),
  //   css: () => import('./routes/error/index.css?inline'),
  //   script: () => import('./routes/error.notinuse/index.js'),
  // },
};

export const dynamicRoutes = [
  {
    pattern: /^\/user\/(?<id>[^/]+)$/,
    html: () => import('./routes/user[id]/index.html?raw'),
    css: () => import('./routes/user[id]/index.css?inline'),
    script: () => import('./routes/user[id]/index.js'),
  },
  // Tournament round route MUST come before tournament detail route
  // because /tournament/:tournamentId/round/:roundId is more specific
  {
    pattern: /^\/tournament\/(?<tournamentId>[^/]+)\/round\/(?<roundId>[^/]+)$/,
    html: () => import('./routes/round[roundId]/index.html?raw'),
    css: () => import('./routes/round[roundId]/index.css?inline'),
    script: () => import('./routes/round[roundId]/index.js'),
  },
  {
    pattern: /^\/tournament\/(?<id>[^/]+)$/,
    html: () => import('./routes/tournament[id]/index.html?raw'),
    css: () => import('./routes/tournament[id]/index.css?inline'),
    script: () => import('./routes/tournament[id]/index.js'),
  },
];
