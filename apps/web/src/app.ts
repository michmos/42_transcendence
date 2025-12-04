import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';
import { env } from './env.js';

// Connect to WebSocket
window.socket = new Socket(env.VITE_SOCKET_URL);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Initial render
await router.render();
