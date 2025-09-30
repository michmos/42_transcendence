// Import the socket plugin first to establish connection early
import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';

// Declare global types for TypeScript
declare global {
  interface Window {
    routeParams?: { id: string };
    router: SimpleRouter;
    socket: Socket;
  }
}

// Connect to the WebSocket server (but don't let it break the app)
window.socket = new Socket('ws://' + window.location.host + '/websocket');

// Connect the router to the main app container
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);

// Expose the router globally for navigation
window.router = router;

// Add static routes
router.add('/', '/routes');
router.add('/socket', '/routes/socket');
router.add('/login', '/routes/login');
router.add('/error', '/routes/error');

// Add dynamic routes with parameters
router.add(/^\/info\/(?<id>[^/]+)$/, '/routes/info[id]');
router.add(/^\/user\/(?<id>[^/]+)$/, '/routes/user[id]');
router.add(/^\/product\/(?<slug>[^/]+)$/, '/routes/product[slug]');

// Initial render
await router.render();
