import { getQuickActionIcon } from '../utils/icons.js';

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

    const iconSvg = getQuickActionIcon(this.props.icon);

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
