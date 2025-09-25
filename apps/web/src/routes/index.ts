// Route initialization function - called by the dynamic route loader
import { generateUserLogic, userTableLogic } from './userTable.js';
import auth from 'auth/frontend';

// Export initialization function that will be called when route loads
export function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    auth();
    userTableLogic();
    generateUserLogic();
  }, 1);
}
