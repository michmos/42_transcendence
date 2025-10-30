export interface EmptyStateProps {
  title: string;
  message?: string;
  emoji?: string;
  className?: string;
}

/**
 * EmptyState
 * A friendly placeholder with optional emoji and a slot for actions.
 */
export class EmptyState {
  private container: HTMLElement;
  private props: EmptyStateProps;

  constructor(container: HTMLElement, props: EmptyStateProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<EmptyStateProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = [
      'text-center rounded-xl border border-white/20 bg-white/10 backdrop-blur p-8 text-white',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    if (this.props.emoji) {
      const icon = document.createElement('div');
      icon.className = 'text-5xl mb-2 opacity-90';
      icon.textContent = this.props.emoji;
      wrapper.appendChild(icon);
    }

    const h3 = document.createElement('h3');
    h3.className = 'text-xl font-semibold';
    h3.textContent = this.props.title;
    wrapper.appendChild(h3);

    if (this.props.message) {
      const p = document.createElement('p');
      p.className = 'text-white/80 mt-2';
      p.textContent = this.props.message;
      wrapper.appendChild(p);
    }

    const actions = document.createElement('div');
    actions.className = 'mt-4 flex justify-center gap-3';
    actions.setAttribute('data-slot', 'actions');
    wrapper.appendChild(actions);

    this.container.appendChild(wrapper);
  }
}

export default EmptyState;
