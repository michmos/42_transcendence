import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';
import API from './plugins/api/index.js';

async function start() {
  // Application started
  const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`;

  // Initialize router
  const router = new SimpleRouter(
    document.getElementById('app') as HTMLElement
  );
  window.router = router;

  // Add API to global window for easy access
  window.api = API;

  window.user = await window.api.getUserProfile();

  // Render initial route based on authentication state
  if (window.user == null) {
    window.router.navigate('/login');
  } else {
    // Initialize WebSocket connection
    window.socket = new Socket(socketUrl);

    // Redirect to profile if on root or login
    if (
      window.location.pathname === '/' ||
      window.location.pathname === '/login'
    ) {
      window.router.navigate('/profile');
    } else window.router.navigate(window.location.pathname);
  }
}

await start();
