# Router Plugin

A modular SPA router with support for dynamic routes, caching, and automatic loading of route-specific assets (HTML, CSS, JavaScript/TypeScript).

## Architecture

The router is split into several focused modules:

### Core Files

- **`index.ts`** - Main router class and public API
- **`types.ts`** - TypeScript interfaces and type definitions

### Feature Modules

- **`navigation.ts`** - Browser navigation handling and link interception
- **`route-matcher.ts`** - URL pattern matching and parameter extraction
- **`content-loader.ts`** - HTML content loading and caching
- **`script-loader.ts`** - JavaScript/TypeScript module loading and execution
- **`css-loader.ts`** - CSS loading and injection

## Usage

```typescript
import { SimpleRouter } from './plugins/router/index.js';

const router = new SimpleRouter(document.getElementById('app')!);

// Static routes
router.add('/', '/routes');
router.add('/about', '/routes/about');

// Dynamic routes with named parameters
router.add(/^\/user\/(?<id>[^/]+)$/, '/routes/user[id]');

// Start the router
router.render();
```

## Route Structure

Each route should have the following file structure:

```
routes/
├── about/
│   ├── index.html    # Required: Route HTML content
│   ├── index.ts      # Optional: Route JavaScript/TypeScript
│   └── index.css     # Optional: Route-specific styles
└── user[id]/
    ├── index.html
    ├── index.ts
    └── index.css
```

### CSS Loading Behavior

- **Automatic Loading**: CSS files are automatically loaded when navigating to a route
- **Style Isolation**: Each route's CSS is scoped and managed independently
- **Cleanup**: Previous route CSS is automatically removed when navigating away
- **Route Classes**: Body element gets route-specific CSS classes for additional styling
- **Performance**: CSS is cached and reused for subsequent visits to the same route

## Route Initialization

Route TypeScript files should export an `initRoute` function:

```typescript
// routes/about/index.ts
export function initRoute() {
  console.log('About route initialized');
  
  // Access route parameters (for dynamic routes)
  const params = (window as any).routeParams;
  
  // Initialize route-specific logic
  setupEventListeners();
  loadData();
}
```

## Features

### ✅ Automatic Asset Loading
- **HTML**: Loads `index.html` for route content
- **CSS**: Automatically loads and injects `index.css`
- **JavaScript**: Loads and executes `index.ts` (dev) or `index.js` (prod)

### ✅ Caching
- HTML content is cached for performance
- Scripts and CSS are re-executed on each visit for dynamic behavior

### ✅ Parameter Support
- Static routes: `/about`
- Dynamic routes with regex: `/user/123` → `{ id: "123" }`
- Parameters available in route scripts via `window.routeParams`

### ✅ Navigation
- Automatic link interception for `<a data-link>` elements
- Browser back/forward button support
- Programmatic navigation via `router.navigate()`

### ✅ Development Experience
- TypeScript support in development (Vite handles compilation)
- Hot reload support
- Detailed debug logging

## API Reference

### SimpleRouter

#### Methods

- `add(path, filePath)` - Register a route
- `navigate(path)` - Navigate to a path programmatically
- `render()` - Render the current route
- `getRoutes()` - Get all registered routes
- `clearCache()` - Clear the HTML cache
- `getCacheSize()` - Get current cache size

### Utility Functions

#### Navigation
- `setupNavigation()` - Initialize navigation event listeners
- `navigateTo()` - Navigate to a path
- `getCurrentPath()` - Get current pathname

#### Route Matching
- `matchRoute()` - Match a path against routes
- `extractRouteParams()` - Extract parameters from regex routes

#### Content Loading
- `loadRouteHTML()` - Load HTML with caching
- `replaceParams()` - Replace parameter placeholders

#### Asset Loading
- `loadRouteScript()` - Load and execute route scripts
- `loadRouteCSS()` - Load and inject route CSS
- `clearAllRouteCSS()` - Remove all route CSS
- `removeRouteCSS()` - Remove specific route CSS
- `setRouteClasses()` - Set route-specific CSS classes on body
- `getLoadedCSSRoutes()` - Get list of currently loaded CSS routes
- `isCSSLoadedForRoute()` - Check if CSS is loaded for a route
- `preloadRouteCSS()` - Preload CSS for multiple routes

## Benefits of Modular Structure

### 🎯 **Separation of Concerns**
- Each module handles one specific responsibility
- Easier to understand and maintain

### 🔧 **Testability**
- Individual modules can be tested in isolation
- Easier to mock dependencies

### 📈 **Scalability**
- Easy to extend functionality without touching core router
- New features can be added as separate modules

### 🚀 **Performance**
- Tree-shaking friendly - unused modules can be eliminated
- Smaller bundle sizes in production

### 👥 **Team Development**
- Multiple developers can work on different modules
- Clearer code ownership and responsibilities
