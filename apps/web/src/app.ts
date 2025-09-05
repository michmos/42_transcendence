// Import the socket plugin first to establish connection early
import { SimpleRouter } from './plugins/router/index.js';
import Socket from './plugins/websocket/index.js';

console.log('🚀 App.ts starting...');

try {
  // Connect to the WebSocket server (but don't let it break the app)
  try {
    Socket.connect('ws://' + window.location.host + '/websocket');
  } catch (socketError) {
    console.warn('WebSocket connection failed:', socketError);
  }

  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error("App root element with id 'app' not found.");
  }

  console.log('🚀 Creating router...');
  const router = new SimpleRouter(appElement);

  console.log('🚀 Adding routes...');
  // Add static routes
  router.add('/', '/routes');
  router.add('/socket', '/routes/socket');

  // Add dynamic routes using regex with named groups
  router.add(/^\/info\/(?<id>[^/]+)$/, '/routes/info[id]');
  router.add(/^\/user\/(?<id>[^/]+)$/, '/routes/user[id]');
  router.add(/^\/product\/(?<slug>[^/]+)$/, '/routes/product[slug]');

  console.log('🚀 Calling initial render...');
  // Initial render
  await router.render();

  console.log('✅ App initialization complete!');
} catch (error) {
  console.error('❌ App initialization failed:', error);
  const appElement = document.getElementById('app');
  if (appElement) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    appElement.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>App Failed to Load</h1>
      <p>Error: ${errorMessage}</p>
      <pre>${errorStack}</pre>
    </div>`;
  }
}
