import { generateUserLogic, userTableLogic } from './userTable.js';
import API from '../plugins/api/index.js';
// import { fetchSessionData } from 'fastify-oauth/client';

export default async function initRoute() {
  console.log('🏠 Home route initializing...');

  // INFO this is how to get the current user!
  let user = await API.getMe();

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

  // Define handler functions so we can remove them later
  function handleLogoutClick() {
    fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include',
    }).then(() => {
      user = null;
      userTableLogic(); // Refresh user table
      if (logoutBtn) {
        logoutBtn.textContent = 'Login';
        logoutBtn.removeEventListener('click', handleLogoutClick);
        logoutBtn.addEventListener('click', handleLoginClick);
      }
    });
  }
  function handleLoginClick() {
    window.router.navigate('/login');
  }

  if (user) {
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', handleLogoutClick);
  } else {
    logoutBtn.textContent = 'Login';
    logoutBtn.addEventListener('click', handleLoginClick);
  }
}
