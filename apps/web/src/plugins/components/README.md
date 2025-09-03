# Component System Plugin

A type-safe, Vite-based component system for building modular frontend applications without global window usage.

## Overview

This plugin provides a complete component system that:
- ✅ **Type-safe**: Full TypeScript support with comprehensive type definitions
- ✅ **No window usage**: Uses document events and custom event dispatchers instead
- ✅ **Vite-only**: Components are transformed at build time via Vite plugin
- ✅ **Modular**: Each component is self-contained with its own HTML and TypeScript files
- ✅ **Event-driven**: Uses custom events for component lifecycle and inter-component communication

## Architecture

### Files Structure

```
src/plugins/components/
├── index.ts          # Runtime component system
├── vite-plugin.ts    # Build-time component transformation
├── types.ts          # Type definitions
└── README.md         # This documentation
```

### Component Structure

```
src/components/ComponentName/
├── index.html        # Component template
├── index.ts          # Component logic
└── index.css         # Component styles (optional)
```

## Usage

### 1. Configure Vite Plugin

In your `vite.config.ts`:

```typescript
import { viteComponentTransform } from './src/plugins/components/vite-plugin.js';

export default defineConfig({
  plugins: [
    viteComponentTransform({
      componentsDir: 'src/components',  // Default
      enableLogging: true               // Default
    }),
    // ... other plugins
  ],
});
```

### 2. Initialize Component System

In your main application file:

```typescript
import { initializeComponentSystem } from './plugins/components/index.js';

// Initialize the component system
initializeComponentSystem();
```

### 3. Create Components

#### Component Class (TypeScript)

```typescript
// src/components/MyComponent/index.ts
interface MyComponentProps {
  items: Item[];
  onItemSelected?: (item: Item) => void;
}

export class MyComponent {
  private container: HTMLElement;
  private props: MyComponentProps;

  constructor(container: HTMLElement, props: MyComponentProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  // Required: update method for reactive updates
  update(items: Item[]) {
    this.props.items = items;
    this.render();
  }

  private render() {
    // Component rendering logic
  }
}

export type { MyComponentProps };
```

#### Component Template (HTML)

```html
<!-- src/components/MyComponent/index.html -->
<div class="my-component">
  <h2>My Component</h2>
  <div class="items-container"></div>
</div>
```

### 4. Use Components in HTML

```html
<!-- Any HTML file -->
<MyComponent data-items="[]" data-on-item-selected="handleSelection"></MyComponent>
```

The Vite plugin will automatically transform this to:

```html
<div id="mycomponent-123456789-abc123" data-component="MyComponent" data-items="[]" data-on-item-selected="handleSelection"></div>
```

## API Reference

### Runtime API

#### Component System

```typescript
import { ComponentSystem } from './plugins/components/index.js';

// Get component instance by element ID
const component = ComponentSystem.get('elementId');

// Get component instance from element
const component = ComponentSystem.getFromElement(element);

// Refresh all components (useful after route changes)
ComponentSystem.refresh();

// Access component registry (read-only)
const registry = ComponentSystem.registry;

// Access event dispatcher
ComponentSystem.events.addEventListener('userRemoved', handleUserRemoved);
```

#### Individual Functions

```typescript
import { 
  initializeComponentSystem,
  initializeComponents,
  getComponent,
  getComponentFromElement,
  refreshComponentSystem
} from './plugins/components/index.js';

// Initialize the entire system
initializeComponentSystem();

// Initialize components in current DOM
initializeComponents();

// Get specific component
const component = getComponent('elementId');

// Refresh system
refreshComponentSystem();
```

### Build-time API

#### Vite Plugin Options

```typescript
interface ComponentTransformOptions {
  readonly componentsDir?: string;        // Default: 'src/components'
  readonly enableLogging?: boolean;       // Default: true
  readonly fileExtensions?: {
    readonly html?: string;               // Default: 'index.html'
    readonly script?: string;             // Default: 'index.ts'
  };
}
```

### Events

#### Component Lifecycle Events

```typescript
// Component ready event (dispatched on the component element)
element.addEventListener('componentReady', (event: ComponentReadyEvent) => {
  const { componentName, component } = event.detail;
  console.log(`${componentName} is ready:`, component);
});

// Component system refresh (dispatched on document)
document.addEventListener('componentSystemRefresh', (event) => {
  console.log('Component system refreshed by:', event.detail.source);
});
```

#### Custom Events

```typescript
// Listen for custom component events
document.addEventListener('userRemoved', () => {
  // Handle user removal
});

// Dispatch custom events
document.dispatchEvent(new CustomEvent('customEvent', {
  detail: { data: 'value' }
}));
```

## Type Safety

### Component Interface

All components must implement the `ComponentWithUpdate` interface:

```typescript
interface ComponentWithUpdate {
  update: (data: User[]) => void;  // Specific to your data type
}
```

### Type Guards

```typescript
import { isComponentElement, isValidComponentName } from './plugins/components/types.js';

// Check if element is a component
if (isComponentElement(element)) {
  // element is ComponentElement
}

// Validate component name
if (isValidComponentName(name)) {
  // name is valid ComponentName
}
```

### Error Handling

```typescript
import { 
  ComponentError, 
  ComponentInitializationError, 
  ComponentNotFoundError 
} from './plugins/components/types.js';

try {
  initializeComponents();
} catch (error) {
  if (error instanceof ComponentInitializationError) {
    console.error('Failed to initialize component:', error.componentName);
  }
}
```

## Best Practices

### 1. Component Design

- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Always define a TypeScript interface for component props
- **Update Method**: Implement the `update` method for reactive data changes
- **Event Handling**: Use custom events for component communication

### 2. Type Safety

- **Strict Types**: Use strict TypeScript configuration
- **Interface Exports**: Export component prop interfaces for reuse
- **Type Guards**: Use provided type guards for runtime type checking

### 3. Performance

- **Lazy Loading**: Components are only initialized when found in DOM
- **Event Cleanup**: Clean up event listeners in component destructors
- **Efficient Updates**: Only re-render when necessary in update methods

### 4. Testing

```typescript
// Test component initialization
import { initializeComponents, getComponent } from './plugins/components/index.js';

// Set up DOM
document.body.innerHTML = '<div id="test" data-component="TestComponent"></div>';

// Initialize
initializeComponents();

// Test
const component = getComponent('test');
expect(component).toBeDefined();
```

## Migration Guide

### From Window-based Components

Before:
```typescript
// Global window access ❌
(window as any).Components = {
  register: () => {},
  get: () => {}
};

window.addEventListener('event', handler);
```

After:
```typescript
// Document events ✅
import { ComponentSystem } from './plugins/components/index.js';

ComponentSystem.events.addEventListener('event', handler);
document.addEventListener('event', handler);
```

### From Manual Component Registration

Before:
```typescript
// Manual registration ❌
const components = {
  UserList: (el, props) => new UserList(el, props)
};
```

After:
```typescript
// Automatic via types ✅
interface ComponentFactories {
  readonly UserList: ComponentFactory<UserListProps>;
}

const componentFactories: ComponentFactories = {
  UserList: (element, props) => new UserList(element, props),
};
```

## Troubleshooting

### Common Issues

1. **Component not found**: Ensure component files exist and follow naming conventions
2. **Type errors**: Check that component implements `ComponentWithUpdate` interface
3. **Events not firing**: Verify event listeners are attached to correct targets
4. **Vite plugin not working**: Check plugin configuration and order

### Debug Mode

Enable debug logging:

```typescript
// In Vite config
viteComponentTransform({
  enableLogging: true
});

// In browser console
// Look for "🚀", "🔧", "✅" prefixed messages
```

## Examples

See the `UserList` component for a complete example implementation.

## Contributing

When adding new components:

1. Follow the established file structure
2. Implement the `ComponentWithUpdate` interface
3. Add proper TypeScript types
4. Update the `ComponentFactories` interface
5. Add component to the factory registry
6. Write tests for the component
