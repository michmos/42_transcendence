// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

export interface NavbarLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps {
  title?: string;
  logoIcon?: string;
  links?: NavbarLink[];
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

/**
 * Navbar
 * Main application navigation bar with logo, navigation links, and profile dropdown.
 */
export class Navbar {
  private container: HTMLElement;
  private props: NavbarProps;
  private isDropdownOpen = false;

  constructor(container: HTMLElement, props: NavbarProps = {}) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<NavbarProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const header = document.createElement('header');
    header.className = [
      'border-b border-border backdrop-blur-glass bg-muted/30 relative z-40',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const headerInner = document.createElement('div');
    headerInner.className = 'max-w-7xl mx-auto px-6 py-4';

    const flexContainer = document.createElement('div');
    flexContainer.className = 'flex items-center justify-between';

    // Left: Logo and Title
    const leftDiv = document.createElement('div');
    leftDiv.className = 'flex items-center gap-3';
    leftDiv.innerHTML = `
      <div class="p-2 bg-accent rounded-lg">
        ${this.props.logoIcon || this.getDefaultLogo()}
      </div>
      <h1 class="text-xl font-bold text-foreground">${this.props.title || 'The Pong Game'}</h1>
    `;

    // Right: Navigation Links and Profile Dropdown
    const rightDiv = document.createElement('div');
    rightDiv.className = 'flex items-center gap-6 ml-auto';

    // Navigation Links (next to profile)
    const nav = document.createElement('nav');
    nav.className = 'flex items-center gap-4';

    (this.props.links || []).forEach((link) => {
      const button = document.createElement('button');
      button.textContent = link.label;
      button.className = link.active
        ? 'text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md cursor-pointer'
        : 'text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md cursor-pointer';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.navigateToRoute) {
          window.navigateToRoute(link.href);
        } else if (window.router) {
          window.router.navigate(link.href);
        }
      });
      nav.appendChild(button);
    });

    // Profile Dropdown Container
    const profileContainer = document.createElement('div');
    profileContainer.className = 'relative';

    // Profile Avatar Button
    const avatarButton = document.createElement('button');
    avatarButton.className =
      'w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer';
    avatarButton.innerHTML = this.getDefaultAvatarIcon();

    // Dropdown Menu
    const dropdown = document.createElement('div');
    dropdown.setAttribute('data-dropdown', '');
    dropdown.className =
      'hidden absolute right-0 mt-2 w-48 rounded-lg border border-border shadow-glow overflow-hidden';
    dropdown.style.top = '100%';
    dropdown.style.zIndex = '9999';
    dropdown.style.backgroundColor = 'hsl(262, 83%, 25%)'; // Solid dark purple background
    dropdown.innerHTML = `
      <div class="py-1">
        <button class="w-full px-4 py-2 text-left text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2 cursor-pointer" data-action="settings">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Settings
        </button>
        <button class="w-full px-4 py-2 text-left text-white hover:bg-muted/50 transition-colors flex items-center gap-2 cursor-pointer" data-action="logout">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    `;

    // Toggle dropdown visibility
    avatarButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    const outsideClickHandler = (e: MouseEvent) => {
      if (!profileContainer.contains(e.target as Node) && this.isDropdownOpen) {
        this.closeDropdown();
      }
    };
    document.addEventListener('click', outsideClickHandler);

    // Handle dropdown actions
    const settingsBtn = dropdown.querySelector('[data-action="settings"]');
    const logoutBtn = dropdown.querySelector('[data-action="logout"]');

    settingsBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Close dropdown first
      this.closeDropdown();
      // Small delay to ensure dropdown closes before navigation
      setTimeout(() => {
        if (this.props.onSettingsClick) {
          this.props.onSettingsClick();
        } else if (window.navigateToRoute) {
          window.navigateToRoute('/settings');
        } else if (window.router) {
          window.router.navigate('/settings');
        } else {
          // Final fallback - direct navigation
          window.location.href = '/settings';
        }
      }, 100);
    });

    logoutBtn?.addEventListener('click', () => {
      if (this.props.onLogoutClick) {
        this.props.onLogoutClick();
      } else if (window.navigateToRoute) {
        window.navigateToRoute('/login');
      }
      this.closeDropdown();
    });

    profileContainer.appendChild(avatarButton);
    profileContainer.appendChild(dropdown);

    rightDiv.appendChild(nav);
    rightDiv.appendChild(profileContainer);

    flexContainer.appendChild(leftDiv);
    flexContainer.appendChild(rightDiv);
    headerInner.appendChild(flexContainer);
    header.appendChild(headerInner);
    this.container.appendChild(header);

    // Cleanup function - remove event listener when component is destroyed
    this.cleanup = () => {
      document.removeEventListener('click', outsideClickHandler);
    };
  }

  private cleanup?: () => void;

  private toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    const dropdown = this.container.querySelector(
      '[data-dropdown]'
    ) as HTMLElement;
    if (dropdown) {
      if (this.isDropdownOpen) {
        dropdown.classList.remove('hidden');
      } else {
        dropdown.classList.add('hidden');
      }
    }
  }

  private closeDropdown(): void {
    this.isDropdownOpen = false;
    const dropdown = this.container.querySelector(
      '[data-dropdown]'
    ) as HTMLElement;
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  }

  private getDefaultLogo(): string {
    return `
      <svg class="w-6 h-6 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    `;
  }

  private getDefaultAvatarIcon(): string {
    return `
      <svg class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    `;
  }
}
export default Navbar;
