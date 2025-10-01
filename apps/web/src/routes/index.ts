import { generateUserLogic, userTableLogic } from './userTable.js';
import { fetchSessionData } from 'fastify-oauth/client';

export default async function initRoute() {
  console.log('🏠 Home route initializing...');

  let user = await fetchSessionData();

  if (user) {
    console.log('User is logged in:', user);
    userTableLogic();
    generateUserLogic();
  } else {
    console.log('No user is logged in');
  }
  // Logout button logic
  const logoutBtn = document.getElementById('logout');
  if (!logoutBtn) {
    throw new Error("Logout button with id 'logout' not found.");
  }

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
          window.router.navigate('/login');
        });
      });
    });
  }

  if (!user) {
    logoutBtn.textContent = 'Login';
    logoutBtn.addEventListener('click', () => {
      window.router.navigate('/login');
    });
  }
}
