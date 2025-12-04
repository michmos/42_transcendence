export interface TableColumn<Row> {
  key: keyof Row | string;
  header: string;
  widthClass?: string;
  render?: (_row: Row) => string | HTMLElement;
  sortable?: boolean;
}

export interface TableProps<Row> {
  columns: Array<TableColumn<Row>>;
  rows: Row[];
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
  onSortChange?: (_key: string, _direction: 'asc' | 'desc') => void;
}

export class Table<Row extends Record<string, unknown>> {
  private container: HTMLElement;
  private props: TableProps<Row>;
  private sortKey: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor(container: HTMLElement, props: TableProps<Row>) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<TableProps<Row>>): void {
    const mergedProps: TableProps<Row> = { ...this.props, ...newProps };
    this.props = mergedProps;
    this.render();
  }

  private sortRows(rows: Row[]): Row[] {
    if (!this.sortKey) return rows;
    const key = this.sortKey as keyof Row;
    const dir = this.sortDirection;
    return [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === bv) return 0;
      if (av == null) return dir === 'asc' ? -1 : 1;
      if (bv == null) return dir === 'asc' ? 1 : -1;
      return (String(av) > String(bv) ? 1 : -1) * (dir === 'asc' ? 1 : -1);
    });
  }

  private handleSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    if (this.props.onSortChange) {
      this.props.onSortChange(key, this.sortDirection);
    }
    this.render();
  }

  private renderHeader(table: HTMLTableElement): void {
    const thead = document.createElement('thead');
    thead.className = 'bg-white/20 text-white';
    const tr = document.createElement('tr');

    this.props.columns.forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col.header;
      th.className = [
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide select-none',
        col.widthClass || '',
        col.sortable ? 'cursor-pointer' : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (col.sortable) {
        th.addEventListener('click', () => this.handleSort(String(col.key)));
      }
      tr.appendChild(th);
    });

    thead.appendChild(tr);
    table.appendChild(thead);
  }

  private renderBody(table: HTMLTableElement): void {
    const tbody = document.createElement('tbody');
    const rows = this.sortRows(this.props.rows);

    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this.props.columns.length;
      td.className = 'px-4 py-8 text-center text-white/80';
      td.textContent = this.props.emptyMessage || 'No data available';
      tr.appendChild(td);
      tbody.appendChild(tr);
      table.appendChild(tbody);
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.className = [
        'border-b border-white/10',
        index % 2 === 1 ? 'bg-white/5' : '',
        'hover:bg-white/10 transition-colors',
      ]
        .filter(Boolean)
        .join(' ');

      this.props.columns.forEach((col) => {
        const td = document.createElement('td');
        td.className = 'px-4 py-3 text-sm text-white/90';
        if (col.render) {
          const content = col.render(row);
          if (content instanceof HTMLElement) td.appendChild(content);
          else td.textContent = String(content);
        } else {
          const value = (row as Record<string, unknown>)[String(col.key)];
          if (value == null) {
            td.textContent = '';
          } else if (typeof value === 'object') {
            td.textContent = JSON.stringify(value);
          } else {
            td.textContent = value as string;
          }
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
  }

  private render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = [
      'overflow-hidden rounded-lg shadow-xl border border-white/20 bg-white/10 backdrop-blur',
      this.props.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const table = document.createElement('table');
    table.className = 'min-w-full';

    this.renderHeader(table);
    this.renderBody(table);

    wrapper.appendChild(table);
    this.container.appendChild(wrapper);
  }
}

export default Table;
