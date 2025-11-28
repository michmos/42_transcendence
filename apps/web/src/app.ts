import { SimpleRouter } from './plugins/router/index.js';
import { Socket } from './plugins/websocket/index.js';
import { getSession } from './plugins/api/auth.js';
import { setSession } from './utils/auth-state.js';

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

// Check session on app load
async function checkSessionAndRedirect() {
  const session = await getSession();
  setSession(session);
  
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/login';
  const isHomePage = currentPath === '/';
  const isErrorPage = currentPath === '/error';
  
  if (session) {
    // User is logged in
    if (isLoginPage || isHomePage) {
      // If on login or home page, redirect to profile
      window.router.navigate('/profile');
      return;
    }
  } else {
    // User is not logged in
    if (!isLoginPage && !isHomePage && !isErrorPage) {
      // If not on login/home/error page, redirect to login
      window.router.navigate('/login');
      return;
    }
  }
  
  // Render the current route
  await router.render();
}

// Check session and render
await checkSessionAndRedirect();
