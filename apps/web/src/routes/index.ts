// Route initialization function - called by the dynamic route loader
import { generateUserLogic, userTableLogic } from './userTable.js';

// Export initialization function that will be called when route loads
export function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    console.log('✅ Starting user table and generate user logic...');
    userTableLogic();
    generateUserLogic();
    console.log('✅ Home route initialization complete');
  }, 1);
}
