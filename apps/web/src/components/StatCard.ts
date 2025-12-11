import { getIcon } from '../utils/icons.js';

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  iconColor?: string;
  className?: string;
}

export class StatCard {
  private container: HTMLElement;
  private props: StatCardProps;
  private rootElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: StatCardProps) {
    this.container = container;
    this.props = { iconColor: 'text-accent', ...props };
    this.render();
  }

  update(newProps: Partial<StatCardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = document.createElement('div');
    this.rootElement.className = `relative overflow-hidden border-border bg-gradient-card backdrop-blur-glass p-6 shadow-card transition-all hover:shadow-glow rounded-2xl border ${this.props.className || ''}`;

    const iconSvg = getIcon(this.props.icon);

    this.rootElement.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="p-2 rounded-lg bg-muted ${this.props.iconColor}">
          ${iconSvg}
        </div>
      </div>
      <p class="text-sm text-muted-foreground mb-1">${this.props.label}</p>
      <p class="text-3xl font-bold text-foreground">${this.props.value}</p>
    `;

    this.container.appendChild(this.rootElement);
  }

  destroy(): void {
    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }
  }
}
