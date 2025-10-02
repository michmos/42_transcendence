export interface HeaderLink {
  label: string;
  href: string;
}

export interface HeaderBarProps {
  title?: string;
  links?: HeaderLink[];
  className?: string;
  onNavigate?: (href: string) => void;
}

/**
 * HeaderBar
 * Simple translucent top navigation bar with pill links.
 */
export class HeaderBar {
  private container: HTMLElement;
  private props: HeaderBarProps;

  constructor(container: HTMLElement, props: HeaderBarProps = {}) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<HeaderBarProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = [
      'w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur px-4 py-3 mb-4',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const inner = document.createElement('div');
    inner.className = 'flex items-center justify-between gap-4';

    const left = document.createElement('div');
    left.className = 'text-white font-semibold';
    left.textContent = this.props.title || 'Mighty Pong Contest';

    const right = document.createElement('nav');
    right.className = 'flex items-center gap-2';

    (this.props.links || []).forEach((l) => {
      const a = document.createElement('a');
      a.href = l.href;
      a.setAttribute('data-link', '');
      a.textContent = l.label;
      a.className = 'px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-sm hover:bg-white/30';
      if (this.props.onNavigate) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          this.props.onNavigate?.(l.href);
        });
      }
      right.appendChild(a);
    });

    inner.appendChild(left);
    inner.appendChild(right);
    wrapper.appendChild(inner);
    this.container.appendChild(wrapper);
  }
}

export default HeaderBar;


