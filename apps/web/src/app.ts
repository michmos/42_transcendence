import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';
import { env } from './env.js';

declare global {
  interface Window {
    routeParams?: Record<string, string>;
    router: SimpleRouter;
    socket: Socket;
  }
}

// Connect to WebSocket
window.socket = new Socket(env.SOCKET_URL);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Initial render
await router.render();
