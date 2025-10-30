import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';

declare global {
  interface Window {
    routeParams?: Record<string, string>;
    router: SimpleRouter;
    socket: Socket;
  }
}

// Connect to WebSocket
const wsHost = window.location.host;
window.socket = new Socket(`ws://${wsHost}/websocket`);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Initial render
await router.render();
