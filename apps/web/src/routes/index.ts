// Route initialization function - called by the dynamic route loader
import { generateUserLogic, userTableLogic } from './userTable.js';
import { initializeLoginButtons } from '../plugins/auth/index.js';

// Export initialization function that will be called when route loads
export function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    initializeLoginButtons();
    userTableLogic();
    generateUserLogic();
  }, 1);
}
