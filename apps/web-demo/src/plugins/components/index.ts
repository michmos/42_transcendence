// Component System Runtime
// This module provides runtime component management for the browser

import type {
  ComponentWithUpdate,
  ComponentElement,
  ComponentFactory,
  ComponentSystemAPI,
  ComponentEventDispatcher,
} from './types.js';
import {
  ComponentInitializationError,
  ComponentNotFoundError,
} from './types.js';

// Component registry to store active components
const componentRegistry = new Map<string, ComponentWithUpdate>();

// Component factory registry to store constructors
const componentFactoryRegistry = new Map<string, ComponentFactory>();

// Event dispatcher for component system
class ComponentEventDispatcherImpl implements ComponentEventDispatcher {
  addEventListener(type: string, listener: EventListener): void {
    document.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    document.removeEventListener(type, listener);
  }

  dispatchEvent(event: Event): boolean {
    return document.dispatchEvent(event);
  }
}

// Create global event dispatcher instance
const eventDispatcher = new ComponentEventDispatcherImpl();

// Dynamic component loader
async function loadComponentModule(componentName: string): Promise<void> {
  if (componentFactoryRegistry.has(componentName)) {
    console.log(`✅ Component ${componentName} already loaded`);
    return;
  }

  const modulePath = `../../components/${componentName}/index.js`;

  try {
    console.log(`📦 Loading component module: ${modulePath}`);
    const module = await import(modulePath);

    if (module.default && typeof module.default === 'function') {
      console.log(`✅ Loaded component factory for ${componentName}`);
      componentFactoryRegistry.set(componentName, module.default);
    } else {
      throw new Error(`Module does not export a default factory function`);
    }
  } catch (error) {
    console.error(`❌ Failed to load component ${componentName}:`, error);
    throw new ComponentInitializationError(
      `Failed to load module: ${error instanceof Error ? error.message : 'Unknown error'}`,
      componentName
    );
  }
}

// Validate component name format
function isValidComponentName(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

// Register a component instance
function registerComponent(
  elementId: string,
  component: ComponentWithUpdate
): void {
  componentRegistry.set(elementId, component);
  console.log(`📝 Registered component instance for element ${elementId}`);
}

// Get default props for a component
function getComponentDefaultProps(componentName: string): unknown {
  switch (componentName) {
    case 'UserList':
      return {
        users: [],
        onUserClick: (userId: string) => {
          console.log(`🖱️ User clicked: ${userId}`);
          // Dispatch user click event using document instead of window
          document.dispatchEvent(
            new CustomEvent('userClicked', { detail: { userId } })
          );
        },
        onUserRemove: (userId: string) => {
          console.log(`🗑️ User remove requested: ${userId}`);
          // Dispatch user remove event using document instead of window
          document.dispatchEvent(
            new CustomEvent('userRemoved', { detail: { userId } })
          );
        },
      };
    default:
      return {};
  }
}

// Find and initialize all components in the DOM
export async function initializeComponents(): Promise<void> {
  console.log('🔍 Scanning for components...');

  // Find all elements with data-component attribute
  const componentElements = document.querySelectorAll('[data-component]');

  for (const element of componentElements) {
    if (element instanceof HTMLElement) {
      const componentName = element.getAttribute('data-component');

      if (componentName && isValidComponentName(componentName)) {
        // Skip if already initialized
        if ((element as ComponentElement).__component) {
          console.log(
            `⏭️ Component ${componentName} already initialized on`,
            element.id
          );
          continue;
        }

        try {
          console.log(
            `🔧 Initializing component ${componentName} on element`,
            element.id
          );

          // Load component module dynamically
          await loadComponentModule(componentName);

          // Get factory from registry
          const factory = componentFactoryRegistry.get(componentName);
          if (!factory) {
            throw new ComponentNotFoundError(componentName, element);
          }

          // Get default props
          const defaultProps = getComponentDefaultProps(componentName);

          // Create component instance
          const componentInstance = factory(element, defaultProps);

          // Store component reference
          (element as ComponentElement).__component = componentInstance;
          (element as ComponentElement).__componentName = componentName;
          (element as ComponentElement).__componentInitialized = true;

          // Register in global registry
          if (element.id) {
            registerComponent(element.id, componentInstance);
          }

          console.log(
            `✅ Successfully initialized ${componentName} on`,
            element.id
          );

          // Dispatch component ready event
          document.dispatchEvent(
            new CustomEvent('componentReady', {
              detail: {
                componentName,
                component: componentInstance,
                element,
                timestamp: new Date(),
              },
            })
          );
        } catch (error) {
          console.error(
            `❌ Failed to initialize component ${componentName}:`,
            error
          );

          // Dispatch component error event
          document.dispatchEvent(
            new CustomEvent('componentError', {
              detail: {
                componentName,
                element,
                error,
                timestamp: new Date(),
              },
            })
          );
        }
      } else {
        console.warn(
          `⚠️ Invalid component name "${componentName}" on`,
          element.id || element.tagName
        );
      }
    }
  }

  console.log(
    `📊 Component system scan complete. ${componentRegistry.size} components active.`
  );
}

// Initialize component system
export function initializeComponentSystem(): void {
  console.log('🚀 Initializing component system...');

  // Initialize components when DOM is ready
  if (document.readyState === 'loading') {
    console.log('⏳ DOM is loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeComponents);
  } else {
    // DOM is already ready
    console.log('✅ DOM is ready, initializing components immediately');
    initializeComponents();
  }

  // Listen for refresh events from route system
  document.addEventListener('componentSystemRefresh', (event) => {
    const customEvent = event as CustomEvent;
    console.log(
      '📥 Received component system refresh event:',
      customEvent.detail
    );
    initializeComponents();
  });
}

// Get component by element ID
export function getComponent(
  elementId: string
): ComponentWithUpdate | undefined {
  return componentRegistry.get(elementId);
}

// Get component from HTML element
export function getComponentFromElement(
  element: HTMLElement
): ComponentWithUpdate | undefined {
  return (element as ComponentElement).__component;
}

// Component System API
export const ComponentSystem: ComponentSystemAPI = {
  get: getComponent,
  getFromElement: getComponentFromElement,
  refresh: initializeComponents,
  registry: componentRegistry,
  events: eventDispatcher,
};

// Export types for external use
export type {
  ComponentWithUpdate,
  ComponentElement,
  ComponentFactory,
  ComponentSystemAPI,
} from './types.js';
