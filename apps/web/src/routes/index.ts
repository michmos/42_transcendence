import { getCurrentSession } from '../utils/auth-state.js';
import { navigateTo } from '../utils/navigation.js';

export default async function initRoute() {
  // Check if we already have a session in memory (from app.ts)
  // app.ts already checked auth, so just use that session
  const currentSession = await getCurrentSession();
  if (currentSession && currentSession.uuid) {
    navigateTo('/profile');
    return;
  }

  // No session - redirect to login
  // (app.ts should have handled this, but just in case)
  navigateTo('/login');
  return;

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
    })
      .then(() => {
        user = null;
        userTableLogic(); // Refresh user table
        if (logoutBtn) {
          logoutBtn.textContent = 'Login';
          logoutBtn.removeEventListener('click', handleLogoutClick);
          logoutBtn.addEventListener('click', handleLoginClick);
        }
      })
      .catch((error) => {
        console.error('Logout failed:', error);
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
