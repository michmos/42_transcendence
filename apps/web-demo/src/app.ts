// Include plugins
import './plugins/routes/index.js';
import './plugins/socket/index.js';
import { initializeComponentSystem } from './plugins/components/index.js';

// Initialize component system
initializeComponentSystem();

// App initialization complete - all functionality is handled by plugins
