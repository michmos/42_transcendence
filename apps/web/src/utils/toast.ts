/**
 * Toast Notification Utility
 * 
 * Provides a simple toast notification system for displaying temporary messages
 * to users. Toasts appear in the top-right corner and auto-dismiss after a delay.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number; // milliseconds, default 5000
  dismissible?: boolean; // default true
}

class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Set<HTMLElement> = new Set();

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    // Check if container already exists
    let existingContainer = document.getElementById('toast-container');
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }

    // Create toast container
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className =
      'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   */
  show(message: string, options: ToastOptions = {}): void {
    if (!this.container) {
      this.createContainer();
    }

    const variant = options.variant || 'info';
    const duration = options.duration ?? 5000;
    const dismissible = options.dismissible !== false;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/20 min-w-[300px] max-w-[400px] animate-slide-in-right ${this.getVariantClasses(variant)}`;

    // Icon
    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0 mt-0.5';
    icon.innerHTML = this.getIcon(variant);
    toast.appendChild(icon);

    // Message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-1 text-sm font-medium text-white';
    messageDiv.textContent = message;
    toast.appendChild(messageDiv);

    // Close button
    if (dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.className =
        'flex-shrink-0 text-white/60 hover:text-white transition-colors';
      closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      `;
      closeBtn.addEventListener('click', () => this.removeToast(toast));
      toast.appendChild(closeBtn);
    }

    // Add to container
    this.container!.appendChild(toast);
    this.toasts.add(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }
  }

  private removeToast(toast: HTMLElement) {
    if (!this.container || !this.toasts.has(toast)) return;

    toast.classList.add('animate-slide-out-right');
    setTimeout(() => {
      if (toast.parentNode === this.container) {
        this.container.removeChild(toast);
      }
      this.toasts.delete(toast);
    }, 300);
  }

  private getVariantClasses(variant: ToastVariant): string {
    const classes = {
      success: 'bg-green-600/90 text-white',
      error: 'bg-red-600/90 text-white',
      info: 'bg-blue-600/90 text-white',
      warning: 'bg-yellow-600/90 text-white',
    };
    return classes[variant];
  }

  private getIcon(variant: ToastVariant): string {
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
    };
    return icons[variant];
  }
}

// Export singleton instance
export const toast = new ToastManager();
export default toast;

