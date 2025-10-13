export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export class SectionHeader {
  private container: HTMLElement;
  private props: SectionHeaderProps;

  constructor(container: HTMLElement, props: SectionHeaderProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<SectionHeaderProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = [
      'mb-4 flex items-center justify-between',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const titles = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.className = 'text-white text-xl font-semibold';
    h2.textContent = this.props.title;
    titles.appendChild(h2);

    if (this.props.subtitle) {
      const p = document.createElement('p');
      p.className = 'text-white/80 text-sm';
      p.textContent = this.props.subtitle;
      titles.appendChild(p);
    }

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';
    actions.setAttribute('data-slot', 'actions');

    wrapper.appendChild(titles);
    wrapper.appendChild(actions);
    this.container.appendChild(wrapper);
  }
}

export default SectionHeader;
