# Install PNPM localy
`npm install -g pnpm --prefix ~/.local`

## Then add this to your shell config (e.g., .bashrc, .zshrc):
`export PATH="$HOME/.local/bin:$PATH"

echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.zshrc
echo 'export PNPM_STORE_PATH="$HOME/.pnpm-store"' >> ~/.zshrc
echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.zshrc
`

# Install NVM (Virtual Node Enviroment) to use Node 24

## Get the Node Virtual Manager
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`

`source ~/.nvm/nvm.sh`

## Install Node24
`nvm install 24`

`nvm use 24`

## make it default
`nvm alias default 24`

# Enviroment
Use a .env loader
I use the plugin 'autoenv' in OhMyZSH for loading the .env

## OhMyZSH
`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`

Add autoenv to the plugin line i the ~/.zshrc

## AutoEnv
`git clone https://github.com/inishchith/autoenv ~/.autoenv`

`echo 'source ~/.autoenv/activate.sh' >> ~/.zshrc`

`echo 'source ~/.autoenv/activate.sh' >> ~/.zshrc`


## How to run the app
`pnpm install` to install the packages
`pnpm run db:generate` to create the db package
`pnpm run db:push` to create the db file and table
`pnpm run dev` to run in development mode

# Component Architecture

This project uses a clean component-based architecture for reusable UI elements. Components are TypeScript classes that encapsulate rendering logic and event handling.

## Components Folder Structure

```
apps/web/src/components/
├── index.ts          # Export barrel for clean imports
└── UserList.ts       # UserList component
```

## Creating Components

Components are TypeScript classes that follow this pattern:

```typescript
interface ComponentProps {
  // Define props interface
}

export class ComponentName {
  private container: HTMLElement;
  private props: ComponentProps;

  constructor(container: HTMLElement, props: ComponentProps) {
    this.container = container;
    this.props = props;
  }

  // Update method for changing component state
  update(newData: any) {
    this.props = { ...this.props, ...newData };
    this.render();
  }

  // Render method to create/update DOM
  render() {
    // DOM creation and manipulation logic
  }
}
```

## UserList Component

The `UserList` component displays users in a table format with action buttons.

### Usage

```typescript
import { UserList } from '../components/index.js';

// Get container element
const container = document.getElementById('userList');

// Create component instance
const userListComponent = new UserList(container, {
  users: [],
  onUserRemoved: () => {
    // Callback when user is removed
    loadUsers();
  }
});

// Update with new data
userListComponent.update(usersArray);
```

### Props

- `users: User[]` - Array of user objects to display
- `onUserRemoved?: () => void` - Optional callback when user is removed

### Features

- **Responsive table** with headers (User ID, Email, Created, Actions)
- **Action buttons** for each user (Info, Remove)
- **Empty state** when no users exist
- **User confirmation** before deletion
- **Truncated IDs** with hover tooltips
- **Auto-refresh** after operations

### User Interface

```typescript
interface User {
  uuid: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}
```

## Component Guidelines

### 1. File Naming
- Use PascalCase for component files: `UserList.ts`
- Export component class and types

### 2. Props Pattern
- Define props interface with clear types
- Use optional properties with `?` when appropriate
- Include callback functions for parent communication

### 3. DOM Management
- Accept container element in constructor
- Clear container before rendering: `this.container.innerHTML = '';`
- Create elements programmatically, avoid innerHTML for dynamic content

### 4. Event Handling
- Bind events in private methods
- Use arrow functions to maintain `this` context
- Clean up event listeners if needed

### 5. State Updates
- Provide `update()` method for external state changes
- Re-render after state updates
- Merge new props with existing ones

### 6. CSS Classes
- Use semantic CSS classes for styling
- Follow existing naming conventions
- Component-specific styles in route CSS files

## Adding New Components

1. **Create component file** in `apps/web/src/components/`
2. **Follow the class pattern** with constructor, render, and update methods
3. **Export from index.ts** for clean imports
4. **Add TypeScript interfaces** for props and data types
5. **Document usage** in this README

## Example: Creating a Button Component

```typescript
// components/Button.ts
interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export class Button {
  private container: HTMLElement;
  private props: ButtonProps;

  constructor(container: HTMLElement, props: ButtonProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(props: Partial<ButtonProps>) {
    this.props = { ...this.props, ...props };
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    
    const button = document.createElement('button');
    button.textContent = this.props.text;
    button.className = `btn btn-${this.props.variant || 'primary'}`;
    button.onclick = this.props.onClick;
    
    this.container.appendChild(button);
  }
}
```

Then export it in `components/index.ts`:

```typescript
export { Button } from './Button.js';
export { UserList } from './UserList.js';
```