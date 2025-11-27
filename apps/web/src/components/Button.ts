export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

export class Button {
  private container: HTMLElement;
  private props: ButtonProps;

  constructor(container: HTMLElement, props: ButtonProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<ButtonProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private classes(): string {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled = false,
    } = this.props;

    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'font-medium',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-white/40',
      'cursor-pointer',
      'disabled:opacity-60',
      'disabled:cursor-not-allowed',
    ].join(' ');

    const variantMap: Record<ButtonVariant, string> = {
      primary:
        'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur',
      secondary:
        'bg-white text-indigo-600 hover:bg-indigo-50 border border-white/80',
      ghost:
        'bg-transparent hover:bg-white/10 text-white border border-white/20',
      danger: 'bg-red-500 hover:bg-red-600 text-white border border-red-500/80',
    };

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-5 py-2.5',
    };

    return [
      base,
      variantMap[variant],
      sizeMap[size],
      fullWidth ? 'w-full' : '',
      disabled ? 'pointer-events-none' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private render(): void {
    this.container.innerHTML = '';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = this.classes();
    button.textContent = this.props.text;
    button.onclick = this.props.onClick;
    button.disabled = Boolean(this.props.disabled);

    this.container.appendChild(button);
  }
}

export default Button;
