# Web Application - Dynamic Routing System

This web application uses a **dynamic, file-based routing system** that automatically discovers and loads routes based on the folder structure. No hardcoded route definitions are needed!

## Overview

The routing system is built with TypeScript and uses Vite's module federation capabilities to create a Single Page Application (SPA) with dynamic route loading.

### Key Features
- ✅ **File-based routing** - Routes are auto-discovered from folder structure
- ✅ **Dynamic routes** with parameters (e.g., `/user/123`, `/info/456`)
- ✅ **Automatic CSS injection** - Route-specific styles are loaded and cleaned up
- ✅ **TypeScript initialization** - Each route can have custom logic
- ✅ **No hardcoded routes** - Fully dynamic discovery system
- ✅ **SPA navigation** - Fast client-side routing with history API

## File Structure

Routes are organized in the `/src/routes/` directory:

```
src/routes/
├── index.html          # Root route (/)
├── index.css           # Root route styles
├── index.ts            # Root route logic
├── about/              # Static route (/about)
│   ├── index.html
│   ├── index.css
│   └── index.ts
├── settings/           # Static route (/settings)
│   └── index.html
├── user[id]/           # Dynamic route (/user/:id)
│   ├── index.html
│   ├── index.css
│   └── index.ts
├── info[id]/           # Dynamic route (/info/:id)
│   ├── index.html
│   ├── index.css
│   └── index.ts
└── product[slug]/      # Dynamic route (/product/:slug)
    └── index.html
```

## Route Types

### 1. Static Routes
Static routes have a fixed path and are organized in named folders:

- `/` → `src/routes/index.*`
- `/about` → `src/routes/about/index.*`
- `/settings` → `src/routes/settings/index.*`

### 2. Dynamic Routes
Dynamic routes use square bracket notation to indicate parameters:

- `/user/123` → `src/routes/user[id]/index.*` (parameter: `id = "123"`)
- `/info/456` → `src/routes/info[id]/index.*` (parameter: `id = "456"`)
- `/product/awesome-widget` → `src/routes/product[slug]/index.*` (parameter: `slug = "awesome-widget"`)

## How It Works

### 1. Route Discovery
The routing system automatically discovers routes using Vite's `import.meta.glob()`:

```typescript
const routeModules = import.meta.glob('/src/routes/**/index.ts');
```

### 2. Navigation Flow
1. User clicks a link with `data-link` attribute or navigates to a URL
2. Router determines if it's a static or dynamic route
3. System attempts to load the corresponding files:
   - `index.html` (required)
   - `index.css` (optional)
   - `index.ts` (optional)

### 3. Content Loading
```typescript
// Example: Loading /user/123
1. Path: "/user/123" is detected as dynamic
2. Extracts: baseRoute = "user", params = ["123"]
3. Looks for: "user[id]" folder
4. Loads: user[id]/index.html, user[id]/index.css, user[id]/index.ts
5. Calls: initRoute({ id: "123" }) if TypeScript module exists
```

## Creating New Routes

### Static Route
1. Create a new folder: `src/routes/my-page/`
2. Add required files:
   ```
   src/routes/my-page/
   ├── index.html    # Page content
   ├── index.css     # Optional styles
   └── index.ts      # Optional logic
   ```
3. Navigate to `/my-page` - it will work automatically!

### Dynamic Route
1. Create a folder with parameter syntax: `src/routes/blog[slug]/`
2. Add files as above
3. Access via `/blog/my-article` - parameter will be `slug = "my-article"`

## TypeScript Route Logic

Each route can have custom initialization logic:

```typescript
// src/routes/my-route/index.ts
export function initRoute(params?: { id: string }) {
  console.log('Route initialized with params:', params);
  
  // Add route-specific class
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('my-route-page');
  }
  
  // Attach event listeners
  attachEventListeners();
  
  // Custom logic here...
}

function attachEventListeners() {
  // Event delegation for dynamic content
  const appContainer = document.getElementById('app');
  
  const button = appContainer?.querySelector('#my-button');
  if (button) {
    button.addEventListener('click', () => {
      console.log('Button clicked!');
    });
  }
}
```

## Navigation

### Creating Navigation Links
Use the `data-link` attribute for SPA navigation:

```html
<!-- Static routes -->
<a href="/" data-link>Home</a>
<a href="/about" data-link>About</a>
<a href="/settings" data-link>Settings</a>

<!-- Dynamic routes -->
<a href="/user/123" data-link>User Profile</a>
<a href="/info/456" data-link>Info Page</a>
<a href="/product/awesome-widget" data-link>Product</a>
```

### Programmatic Navigation
```typescript
// Access the global router
const router = (window as any).router;

// Navigate to a route
router.navigate('/user/123');
router.navigate('/about');
```

## CSS Management

### Route-Specific Styles
- Each route can have its own `index.css` file
- Styles are automatically injected when the route loads
- Previous route styles are cleaned up to prevent conflicts
- Styles are added with a `data-route` attribute for identification

### Example CSS Structure
```css
/* src/routes/user[id]/index.css */
.user-page {
  background-color: #f0f8ff;
}

.user-profile-card {
  border: 2px solid #007acc;
  border-radius: 8px;
  padding: 20px;
}

#user-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
```

## Error Handling

### Fallback Behavior
- If a route file doesn't exist, the system gracefully handles the error
- Missing CSS files are ignored (optional)
- Missing TypeScript files are ignored (optional)
- Missing HTML files show an error message

### 404 Handling
- Unmatched routes show a "Page Not Found" message
- The system attempts to match dynamic routes before falling back
- Custom 404 pages can be implemented by modifying the fallback handler

## Configuration Files

### Core Router Files
- `src/plugins/routes/router.ts` - Main Router class
- `src/plugins/routes/index.ts` - Route registration and navigation
- `src/plugins/routes/dynamic.ts` - Dynamic route loading logic
- `src/plugins/routes/utils.ts` - Utility functions

## Performance Considerations

- **Lazy Loading**: Routes are loaded on-demand
- **Code Splitting**: Each route's TypeScript is a separate module
- **CSS Cleanup**: Previous route styles are removed to prevent bloat
- **Caching**: Vite handles module caching automatically

## Best Practices

1. **File Naming**: Always use `index.html`, `index.css`, `index.ts`
2. **Parameter Names**: Use descriptive parameter names like `[id]`, `[slug]`, `[category]`
3. **Event Delegation**: Use event delegation in TypeScript for dynamic content
4. **Class Management**: Add route-specific classes for styling isolation
5. **Error Handling**: Always check if DOM elements exist before manipulating them

## Example Routes

Here are the current working routes in the application:

- `/` - Home page with user management
- `/about` - About page
- `/settings` - Settings page  
- `/user/123` - User profile for user ID 123
- `/info/456` - Info page for ID 456

Try navigating to these routes to see the system in action!

---

## Development Setup

### Development Commands
```bash
pnpm dev           # Start Vite dev server
pnpm dev:stop      # Stop nginx container
pnpm build         # Build static files to 'out' folder
```
