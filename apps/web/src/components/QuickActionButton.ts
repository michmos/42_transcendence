export interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary';
}

export class QuickActionButton {
  private container: HTMLElement;
  private props: QuickActionButtonProps;
  private rootElement: HTMLButtonElement | null = null;

  constructor(container: HTMLElement, props: QuickActionButtonProps) {
    this.container = container;
    this.props = { variant: 'default', ...props };
    this.render();
  }

  update(newProps: Partial<QuickActionButtonProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = document.createElement('button');

    const baseClasses =
      'w-full justify-start gap-3 border border-border text-foreground font-medium transition-all hover:scale-[1.02] hover:shadow-glow px-4 py-3 rounded-lg flex items-center';
    const variantClasses =
      this.props.variant === 'primary'
        ? 'bg-secondary hover:bg-secondary/80'
        : 'bg-secondary/30 hover:bg-secondary/50';

    this.rootElement.className = `${baseClasses} ${variantClasses} cursor-pointer ${this.props.className || ''}`;

    // Map emoji to icon SVG
    const iconMap: Record<string, string> = {
      '🎮': '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.82 12.49a.5.5 0 0 0-.76-.43l-1.45.87a.5.5 0 0 1-.51 0l-1.45-.87a.5.5 0 0 0-.76.43v2.51l2.5 1.5 2.5-1.5z"/><path d="m10.5 12.5-1.5.9-1.5-.9"/><path d="M6 12V6.5C6 4 7.5 3 9.5 3H14c1 0 2 .5 2 2v9.5"/><path d="m16.5 5.5-2 2.5 2 2.5"/></svg>',
      '👥': '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      '🎯': '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      '📊': '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    };

    const iconSvg =
      iconMap[this.props.icon] ||
      `<span class="text-lg">${this.props.icon}</span>`;

    this.rootElement.innerHTML = `
      ${iconSvg}
      <span>${this.props.label}</span>
    `;

    if (this.props.onClick) {
      this.rootElement.addEventListener('click', this.props.onClick);
    }

    this.container.appendChild(this.rootElement);
  }

  destroy(): void {
    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }
  }
}
