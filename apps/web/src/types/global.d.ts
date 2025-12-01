// Global type declarations for the web application

import type { SimpleRouter } from '../plugins/router/index.js';
import type { Socket } from '../plugins/websocket/index.js';

declare global {
  interface Window {
    // SPA Navigation
    navigateToRoute?: (_href: string) => void;
    routeParams?: Record<string, string>;

    // Application instances
    router: SimpleRouter;
    socket: Socket;
  }
}

export {};
