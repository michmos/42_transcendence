// Route initialization function - called by the dynamic route loader
import { generateUserLogic, userTableLogic } from './userTable.js';
import { fetchSessionData } from 'fastify-oauth/client';

import { SimpleRouter } from '../plugins/router/index.js';

const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error("App root element with id 'app' not found.");
}

console.log('🚀 Creating router...');
const router = new SimpleRouter(appElement);

// Export initialization function that will be called when route loads
export async function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(async () => {
    userTableLogic();
    generateUserLogic();
  }, 1);

  let user = await fetchSessionData();

  // Logout button logic
  const logoutBtn = document.getElementById('logout');

  if (!logoutBtn) {
    throw new Error("Logout button with id 'logout' not found.");
  }

  router.add('/login', '/routes/login');

  if (user) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      }).then(() => {
        user = null;
        userTableLogic(); // Refresh user table
        logoutBtn.textContent = 'Login';
        logoutBtn.addEventListener('click', () => {
          router.navigate('/login');
        });
      });
    });
  }

  if (!user) {
    logoutBtn.textContent = 'Login';
    logoutBtn.addEventListener('click', () => {
      console.log(router.getRoutes());
      router.navigate('/login');
    });
  }
}
