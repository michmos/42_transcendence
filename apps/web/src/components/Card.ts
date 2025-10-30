export type CardVariant = 'default' | 'accent' | 'subtle';

export interface CardProps {
  title?: string;
  subtitle?: string;
  variant?: CardVariant;
  className?: string;
}

/**
 * Card
 * Glassmorphic panel with optional header and actions area.
 */
export class Card {
  private container: HTMLElement;
  private props: CardProps;
  private rootElement: HTMLDivElement | null = null;
  private headerElement: HTMLDivElement | null = null;
  private actionsElement: HTMLDivElement | null = null;
  private bodyElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: CardProps = {}) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<CardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  getBodyElement(): HTMLDivElement | null {
    return this.bodyElement;
  }

  getActionsElement(): HTMLDivElement | null {
    return this.actionsElement;
  }

  private computeClasses(): string {
    const { variant = 'default', className = '' } = this.props;
    const base =
      'rounded-xl shadow-xl border backdrop-blur-md p-6 transition-colors';

    const variantMap: Record<CardVariant, string> = {
      default: 'bg-white/10 border-white/20',
      accent: 'bg-white/15 border-white/30',
      subtle: 'bg-white/5 border-white/10',
    };

    return [base, variantMap[variant], className].filter(Boolean).join(' ');
  }

  private render(): void {
    this.container.innerHTML = '';

    const root = document.createElement('div');
    root.className = this.computeClasses();

    if (this.props.title || this.props.subtitle) {
      const header = document.createElement('div');
      header.className = 'mb-4 flex items-start justify-between gap-4';

      const titles = document.createElement('div');
      if (this.props.title) {
        const h2 = document.createElement('h2');
        h2.textContent = this.props.title;
        h2.className = 'text-white font-semibold text-xl';
        titles.appendChild(h2);
      }
      if (this.props.subtitle) {
        const p = document.createElement('p');
        p.textContent = this.props.subtitle;
        p.className = 'text-white/80 text-sm';
        titles.appendChild(p);
      }

      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-2';

      header.appendChild(titles);
      header.appendChild(actions);

      root.appendChild(header);
      this.headerElement = header;
      this.actionsElement = actions;
    }

    const body = document.createElement('div');
    body.className = 'w-full';
    root.appendChild(body);

    this.container.appendChild(root);

    this.rootElement = root;
    this.bodyElement = body;
  }
}

export default Card;
