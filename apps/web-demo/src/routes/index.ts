import { getUsers, generateUser } from '../plugins/fetch/index.js';
import {
  ComponentSystem,
  type ComponentWithUpdate,
} from '../plugins/components/index.js';

// Root page specific TypeScript functionality
console.log('Root page TypeScript loaded!');

// Global reference to the UserList component
let userListComponent: ComponentWithUpdate | null = null;

// Route initialization function - called by the dynamic route loader
export function initRoute() {
  console.log('Root page initialized');

  // Add root-specific class to the app container when this route loads
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('root-page');
  }

  // Wait a bit for component system to initialize the newly loaded content
  setTimeout(() => {
    // Wait for components to be initialized, then setup
    waitForComponents();

    // Attach event listeners for root page buttons
    attachRootEventListeners();
  }, 100);
}

// Wait for components to be initialized using the global component system
function waitForComponents() {
  console.log('👀 Looking for UserList components...');

  const userListElement = document.querySelector(
    '[data-component="UserList"]'
  ) as HTMLElement;

  if (userListElement) {
    console.log('🎯 Found UserList element:', userListElement.id);

    // Try to get component from ComponentSystem
    userListComponent = ComponentSystem.getFromElement(userListElement) || null;
    if (userListComponent) {
      console.log('✅ UserList component found via ComponentSystem');
      setupComponentListeners(userListElement);
      loadAndDisplayUsers();
      return;
    }

    // Listen for component ready event
    userListElement.addEventListener(
      'componentReady',
      (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('✅ UserList component ready event received');
        userListComponent = customEvent.detail.component;
        setupComponentListeners(userListElement);
        loadAndDisplayUsers();
      },
      { once: true }
    );

    // Listen for global user removal events
    document.addEventListener('userRemoved', () => {
      console.log('🔄 Global user removal event received');
      loadAndDisplayUsers();
    });

    // Fallback: check periodically for the component
    const checkInterval = setInterval(() => {
      const component = ComponentSystem.getFromElement(userListElement);
      if (component && !userListComponent) {
        clearInterval(checkInterval);
        userListComponent = component;
        console.log('✅ UserList component found via fallback check');
        setupComponentListeners(userListElement);
        loadAndDisplayUsers();
      }
    }, 200);

    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!userListComponent) {
        console.warn(
          '⚠️ UserList component not found or not initialized after 10 seconds'
        );
      }
    }, 10000);
  } else {
    console.warn('⚠️ UserList element not found in DOM');
  }
}

// Setup component event listeners
function setupComponentListeners(userListElement: HTMLElement) {
  // Listen for component-specific user removal events
  userListElement.addEventListener('userRemoved', () => {
    console.log('🔄 Component user removal event received');
    loadAndDisplayUsers();
  });
}

// Function to load and display users using the component
async function loadAndDisplayUsers() {
  console.log('📊 Loading and displaying users...');

  try {
    const users = await getUsers();
    console.log(`📦 Fetched ${users.length} users from API`);

    if (userListComponent) {
      userListComponent.update(users);
      console.log('✅ Updated UserList with', users.length, 'users');
    } else {
      console.warn('⚠️ UserList component not available for update');

      // Try to find the component again
      const userListElement = document.querySelector(
        '[data-component="UserList"]'
      ) as HTMLElement;
      if (userListElement) {
        const component = ComponentSystem.getFromElement(userListElement);
        if (component) {
          userListComponent = component;
          userListComponent.update(users);
          console.log('✅ Found and updated UserList component on retry');
          return;
        }
      }

      console.log('ℹ️ Will retry when component becomes available');
    }
  } catch (error) {
    console.error('❌ Error loading users:', error);
  }
}

// Helper function to attach event listeners for root page
function attachRootEventListeners() {
  // Use event delegation for dynamically loaded content
  const appContainer = document.getElementById('app') || document.body;

  // Remove existing listeners to prevent duplicates
  const existingMakeUserBtn = appContainer.querySelector(
    '#makeUserBtn'
  ) as HTMLElement;

  if (existingMakeUserBtn)
    existingMakeUserBtn.onclick = async (e) => {
      e.preventDefault();
      console.log('🔧 Generating new user...');
      const newUser = await generateUser();
      if (newUser) {
        console.log('✅ User generated, updating list...');
        // Reload and display updated user list
        await loadAndDisplayUsers();
      }
    };

  // Add some root-specific functionality
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button) => {
    button.addEventListener('mouseenter', () => {
      console.log('Button hovered:', button.textContent);
    });
  });
}
