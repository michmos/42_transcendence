import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';

declare global {
  interface Window {
    routeParams?: Record<string, string>;
    router: SimpleRouter;
    socket: Socket;
  }
}

const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`;

// Connect to WebSocket
window.socket = new Socket(socketUrl);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Initial render
await router.render();
