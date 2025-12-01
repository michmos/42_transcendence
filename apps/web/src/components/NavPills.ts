export interface NavPillItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavPillsProps {
  items: NavPillItem[];
  onNavigate?: (_href: string) => void;
  className?: string;
}

/**
 * NavPills
 * Horizontal list of pill-like navigation links using SPA `data-link`.
 */
export class NavPills {
  private container: HTMLElement;
  private props: NavPillsProps;

  constructor(container: HTMLElement, props: NavPillsProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<NavPillsProps>): void {
    this.props = { ...this.props, ...newProps } as NavPillsProps;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const nav = document.createElement('nav');
    nav.className = [
      'flex flex-wrap items-center gap-3',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    this.props.items.forEach((item) => {
      const a = document.createElement('a');
      a.href = item.href;
      a.setAttribute('data-link', '');
      a.textContent = item.label;
      a.className = [
        'px-4 py-2 rounded-full border backdrop-blur text-sm transition-colors',
        'bg-white/20 border-white/30 text-white hover:bg-white/30',
        item.active ? 'ring-2 ring-white/50' : '',
      ]
        .filter(Boolean)
        .join(' ');

      if (this.props.onNavigate) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          this.props.onNavigate?.(item.href);
        });
      }

      nav.appendChild(a);
    });

    this.container.appendChild(nav);
  }
}

export default NavPills;
