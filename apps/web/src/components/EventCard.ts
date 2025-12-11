export interface EventCardProps {
  icon?: string;
  title: string;
  date: string;
  location: string;
  className?: string;
  onClick?: () => void;
}

export class EventCard {
  private container: HTMLElement;
  private props: EventCardProps;
  private rootElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: EventCardProps) {
    this.container = container;
    this.props = { icon: '📅', ...props };
    this.render();
  }

  update(newProps: Partial<EventCardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = document.createElement('div');
    this.rootElement.className = `flex gap-3 p-3 rounded-lg bg-gradient-card backdrop-blur-glass border border-border hover:bg-muted/30 transition-all ${this.props.className || ''}`;

    if (this.props.onClick) {
      this.rootElement.style.cursor = 'pointer';
      this.rootElement.addEventListener('click', this.props.onClick);
    }

    this.rootElement.innerHTML = `
      <div class="shrink-0 mt-1">
        <svg class="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2v4"/>
          <path d="M16 2v4"/>
          <rect width="18" height="18" x="3" y="4" rx="2"/>
          <path d="M3 10h18"/>
        </svg>
      </div>
      <div>
        <p class="font-semibold text-foreground text-sm">${this.props.title}</p>
        <p class="text-xs text-muted-foreground">${this.props.date}</p>
        <p class="text-xs text-muted-foreground">${this.props.location}</p>
      </div>
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
