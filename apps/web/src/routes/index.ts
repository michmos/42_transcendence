// import { getCurrentSession } from '../utils/auth-state.js';
// import { navigateTo } from '../utils/navigation.js';

export default function initRoute() {
  // Check authentication status and redirect accordingly
  if (window.user == null) {
    window.router.navigate('/login');
  } else {
    window.router.navigate('/profile');
  }
}
