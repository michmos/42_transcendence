import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';
import API from './plugins/api/index.js';

// Connect to WebSocket server
const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket/`;
window.socket = new Socket(socketUrl);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Add API to global window for easy access
window.api = API;

// Fetch current user profile
window.user = await window.api.getUserProfile();

// Render initial route based on authentication state
if (window.user == null) {
  window.router.navigate('/login');
} else if (
  window.location.pathname === '/' ||
  window.location.pathname === '/login'
) {
  window.router.navigate('/profile');
} else {
  window.router.navigate(window.location.pathname);
}
