export interface GlassCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  showHeader?: boolean;
}

/**
 * GlassCard - A glassmorphism card component matching dashboard-muse-99 design
 */
export class GlassCard {
  private container: HTMLElement;
  private props: GlassCardProps;
  private rootElement: HTMLDivElement | null = null;
  private headerElement: HTMLDivElement | null = null;
  private bodyElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: GlassCardProps = {}) {
    this.container = container;
    this.props = { showHeader: true, ...props };
    this.render();
  }

  update(newProps: Partial<GlassCardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  getBodyElement(): HTMLDivElement | null {
    return this.bodyElement;
  }

  getHeaderElement(): HTMLDivElement | null {
    return this.headerElement;
  }

  private render(): void {
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = document.createElement('div');
    this.rootElement.className = `border-border bg-gradient-card backdrop-blur-glass p-6 shadow-card rounded-2xl border ${this.props.className || ''}`;

    // Header
    if (this.props.showHeader && (this.props.title || this.props.subtitle)) {
      this.headerElement = document.createElement('div');
      this.headerElement.className = 'mb-4';

      if (this.props.title) {
        const titleEl = document.createElement('h2');
        titleEl.className = 'text-xl font-bold text-foreground';
        titleEl.textContent = this.props.title;
        this.headerElement.appendChild(titleEl);
      }

      if (this.props.subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'text-sm text-muted-foreground mt-1';
        subtitleEl.textContent = this.props.subtitle;
        this.headerElement.appendChild(subtitleEl);
      }

      this.rootElement.appendChild(this.headerElement);
    }

    // Body
    this.bodyElement = document.createElement('div');
    this.bodyElement.className = 'glass-card-body';
    this.rootElement.appendChild(this.bodyElement);

    this.container.appendChild(this.rootElement);
  }

  destroy(): void {
    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
      this.headerElement = null;
      this.bodyElement = null;
    }
  }
}
