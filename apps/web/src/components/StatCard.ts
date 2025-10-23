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

    // Map emoji to icon SVG
    const iconMap: Record<string, string> = {
      '🎯': '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      '📈': '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 7-6-4-6 4-6-4v14l6-4 6 4 6-4z"/></svg>',
      '🏆': '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
      '📊': '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    };

    const iconSvg =
      iconMap[this.props.icon] ||
      `<span class="text-xl">${this.props.icon}</span>`;

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
