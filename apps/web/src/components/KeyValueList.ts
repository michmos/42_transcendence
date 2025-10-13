export interface KeyValueItem {
  key: string;
  value: string | number | boolean | null | undefined;
}

export interface KeyValueListProps {
  title?: string;
  items: KeyValueItem[];
  className?: string;
}

/**
 * KeyValueList
 * Displays labeled values in a stacked list, suitable for info panels.
 */
export class KeyValueList {
  private container: HTMLElement;
  private props: KeyValueListProps;

  constructor(container: HTMLElement, props: KeyValueListProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<KeyValueListProps>): void {
    this.props = { ...this.props, ...newProps } as KeyValueListProps;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = [
      'rounded-lg border border-white/20 bg-white/10 p-4 text-white backdrop-blur',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    if (this.props.title) {
      const h3 = document.createElement('h3');
      h3.className = 'mb-3 text-white font-semibold';
      h3.textContent = this.props.title;
      wrapper.appendChild(h3);
    }

    const list = document.createElement('dl');
    list.className = 'grid grid-cols-1 gap-2';

    this.props.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'flex items-baseline gap-2';

      const dt = document.createElement('dt');
      dt.className = 'text-white/80 text-sm min-w-24';
      dt.textContent = item.key + ':';

      const dd = document.createElement('dd');
      dd.className = 'text-amber-200 font-semibold';
      dd.textContent = String(item.value ?? '—');

      row.appendChild(dt);
      row.appendChild(dd);
      list.appendChild(row);
    });

    wrapper.appendChild(list);
    this.container.appendChild(wrapper);
  }
}

export default KeyValueList;
