// Route initialization function - called by the dynamic route loader
import auth from 'fastify-oauth/client';

// Export initialization function that will be called when route loads
export function initRoute() {
  console.log('🏠 Home route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(async () => {
    await auth();
  }, 1);
}
