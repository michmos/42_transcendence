import type { User } from 'db/generated/client/index.js';
import { Table, type TableColumn } from './Table.js';
import { Button } from './Button.js';

export interface UserTableProps {
  users: User[];
  onInfo?: (user: User) => void;
  onRemove?: (user: User) => void;
  className?: string;
}

export class UserTable {
  private container: HTMLElement;
  private props: UserTableProps;
  private table: Table<User> | null = null;

  constructor(container: HTMLElement, props: UserTableProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<UserTableProps>): void {
    this.props = { ...this.props, ...newProps } as UserTableProps;
    this.render();
  }

  private columns(): TableColumn<User>[] {
    return [
      { key: 'uuid', header: 'ID', widthClass: 'w-1/3', sortable: true },
      { key: 'nickname', header: 'NickName', sortable: true },
      { key: 'email', header: 'Email', sortable: true },
      {
        key: 'actions',
        header: 'Actions',
        widthClass: 'w-36',
        render: (row: User) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'flex justify-end gap-2';

          const infoHost = document.createElement('div');
          new Button(infoHost, {
            text: 'Info',
            variant: 'ghost',
            size: 'sm',
            onClick: () => this.props.onInfo?.(row),
          });
          wrapper.appendChild(infoHost);

          const removeHost = document.createElement('div');
          new Button(removeHost, {
            text: 'Remove',
            variant: 'danger',
            size: 'sm',
            onClick: () => this.props.onRemove?.(row),
          });
          wrapper.appendChild(removeHost);

          return wrapper;
        },
      },
    ];
  }

  private render(): void {
    this.container.innerHTML = '';
    const host = document.createElement('div');
    this.container.appendChild(host);

    this.table = new Table<User>(host, {
      columns: this.columns(),
      rows: this.props.users,
      emptyTitle: 'No Users',
      emptyMessage: 'No users found. Try generating one.',
      ...(this.props.className ? { className: this.props.className } : {}),
    });
  }
}

export default UserTable;
