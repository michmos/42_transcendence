export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}

export class Badge {
  private container: HTMLElement;
  private props: BadgeProps;

  constructor(container: HTMLElement, props: BadgeProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<BadgeProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private classes(): string {
    const { variant = 'default', className = '' } = this.props;
    const base = [
      'inline-flex',
      'items-center',
      'rounded-full',
      'px-2.5',
      'py-1',
      'text-xs',
      'font-medium',
    ].join(' ');
    const map: Record<BadgeVariant, string> = {
      default: 'bg-white/20 text-white border border-white/20',
      success:
        'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30',
      warning: 'bg-amber-500/20 text-amber-100 border border-amber-400/30',
      danger: 'bg-red-500/20 text-red-100 border border-red-400/30',
      info: 'bg-sky-500/20 text-sky-100 border border-sky-400/30',
    };
    return [base, map[variant], className].filter(Boolean).join(' ');
  }

  private render(): void {
    this.container.innerHTML = '';
    const span = document.createElement('span');
    span.className = this.classes();
    span.textContent = this.props.text;
    this.container.appendChild(span);
  }
}

export default Badge;
