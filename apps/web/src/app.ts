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

const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`;

// Connect to WebSocket
window.socket = new Socket(socketUrl);

// Initialize router
const router = new SimpleRouter(document.getElementById('app') as HTMLElement);
window.router = router;

// Check session on app load
async function checkSessionAndRedirect() {
  // Check if we're coming from OAuth callback
  // The OAuth callback sets a cookie and redirects to /, so we need to wait for the cookie
  const oauthFlag = sessionStorage.getItem('oauth_redirect');
  const isOAuthCallback = oauthFlag === 'true';

  // Clear the flag if it exists
  if (isOAuthCallback) {
    sessionStorage.removeItem('oauth_redirect');
  }

  // After OAuth callback redirect, cookies might not be immediately available
  // Wait longer for cookies to be set, then check with retries
  if (isOAuthCallback) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second after OAuth callback
  } else {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for normal loads
  }

  let session = null;
  const maxRetries = isOAuthCallback ? 4 : 2; // More retries after OAuth callback

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms between retries
    }

    try {
      session = await getSession();
      if (session) {
        break;
      }
    } catch (error) {
      // Only log errors on final attempt
      if (attempt === maxRetries - 1) {
        console.error('[app.ts] Session check failed:', error);
      }
    }
  }

  setSession(session);

  // Re-read currentPath in case it changed during the wait
  const finalPath = window.location.pathname;
  const isLoginPage = finalPath === '/login';
  const isHomePage = finalPath === '/';
  const isErrorPage = finalPath === '/error';

  // Handle redirects based on session and current path
  if (session) {
    // User is logged in
    if (isLoginPage || isHomePage) {
      // Redirect from login/home to profile
      window.router.navigate('/profile');
      return;
    }
    // On any other page, just render it
    await router.render();
    return;
  } else {
    // User is not logged in
    if (isLoginPage || isHomePage || isErrorPage) {
      // Allow access to login/home/error pages
      await router.render();
      return;
    }
    // Redirect protected routes to login
    window.router.navigate('/login');
    return;
  }
}

// Check session and render
await checkSessionAndRedirect();
