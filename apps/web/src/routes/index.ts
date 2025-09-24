// Route initialization function - called by the dynamic route loader
import { generateUserLogic, userTableLogic } from './userTable.js';
import { setupGoogleAuthButton } from '../plugins/googleAuth/index.js';

// Export initialization function that will be called when route loads
export function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    setupGoogleAuthButton();
    userTableLogic();
    generateUserLogic();
  }, 1);
}
