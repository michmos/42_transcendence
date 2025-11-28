import { generateUserLogic, userTableLogic } from './userTable.js';
import { fetchSessionData } from 'fastify-oauth/client';
import { setSession } from '../utils/auth-state.js';
import { navigateTo } from '../utils/navigation.js';

export default async function initRoute() {
  console.log('🏠 Home route initializing...');

  // Check if user is logged in (after OAuth callback, user lands here)
  const user = await fetchSessionData();

  if (user) {
    console.log('User is logged in:', user);
    // Store session in auth state
    setSession({
      uuid: user.uuid,
      role: 'USER', // TODO: Fetch actual role if needed
    });
    
    // Redirect to profile page after successful login
    navigateTo('/profile');
    return;
  } else {
    console.log('No user is logged in');
    // Clear any stale session
    setSession(null);
    // Redirect to login if not authenticated
    navigateTo('/login');
    return;
  }
  
  // Note: The code below is unreachable due to redirects above
  // Keeping it commented for reference in case we need home route functionality later
  /*
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
  */
}
