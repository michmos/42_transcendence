// Global type declarations for the web application

import type { SimpleRouter } from '../plugins/router/index.js';
import type { Socket } from '../plugins/websocket/index.js';

/* eslint-disable no-unused-vars */

declare global {
  interface Window {
    // SPA Navigation
    navigateToRoute?: (href: string) => void;
    routeParams?: Record<string, string>;

    // Application instances
    router: SimpleRouter;
    socket: Socket;
  }
}

/* eslint-enable no-unused-vars */

export {};
