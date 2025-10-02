export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  title?: string;
  message: string;
  variant?: AlertVariant;
  dismissible?: boolean;
  className?: string;
  onClose?: () => void;
}

export class Alert {
  private container: HTMLElement;
  private props: AlertProps;
  private rootElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: AlertProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<AlertProps>): void {
    this.props = { ...this.props, ...newProps } as AlertProps;
    this.render();
  }

  close(): void {
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
    }
    if (this.props.onClose) this.props.onClose();
  }

  private variantClasses(variant: AlertVariant): string {
    const base = 'rounded-lg border p-4 text-sm backdrop-blur';
    const map: Record<AlertVariant, string> = {
      info: 'bg-sky-500/15 border-sky-400/30 text-sky-100',
      success: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-100',
      warning: 'bg-amber-500/15 border-amber-400/30 text-amber-100',
      error: 'bg-red-500/15 border-red-400/30 text-red-100',
    };
    return [base, map[variant]].join(' ');
  }

  private render(): void {
    this.container.innerHTML = '';

    const variant = this.props.variant || 'info';
    const root = document.createElement('div');
    root.className = [this.variantClasses(variant), this.props.className || '']
      .filter(Boolean)
      .join(' ');

    const content = document.createElement('div');
    content.className = 'flex items-start gap-3';

    const text = document.createElement('div');
    const title = this.props.title;
    if (title) {
      const h4 = document.createElement('h4');
      h4.className = 'font-semibold';
      h4.textContent = title;
      text.appendChild(h4);
    }

    const p = document.createElement('p');
    p.textContent = this.props.message;
    text.appendChild(p);

    content.appendChild(text);

    if (this.props.dismissible) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ml-auto text-white/80 hover:text-white';
      btn.textContent = '✕';
      btn.addEventListener('click', () => this.close());
      content.appendChild(btn);
    }

    root.appendChild(content);
    this.container.appendChild(root);
    this.rootElement = root;
  }
}

export default Alert;
