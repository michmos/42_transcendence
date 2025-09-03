import { deleteUser, type User } from '../../plugins/fetch/index.js';

interface UserListProps {
  users: User[];
  onUserRemoved?: () => void;
}

export class UserList {
  private container: HTMLElement;
  private props: UserListProps;

  constructor(container: HTMLElement, props: UserListProps) {
    this.container = container;
    this.props = props;
    this.initializeComponent();
  }

  // Initialize the component with its HTML structure
  private async initializeComponent() {
    // Load the component HTML
    const componentHtml = await this.loadComponentHtml();
    this.container.innerHTML = componentHtml;

    // Find the table container within the component
    const tableContainer = this.container.querySelector(
      '.users-table-container'
    ) as HTMLElement;
    if (tableContainer) {
      this.container = tableContainer;
    }

    this.render();
  }

  // Load component HTML template
  private async loadComponentHtml(): Promise<string> {
    try {
      const response = await fetch('/src/components/UserList/index.html');
      return await response.text();
    } catch (error) {
      console.error('Failed to load UserList component HTML:', error);
      return '<div class="user-list-component"><div class="users-table-container"></div></div>';
    }
  }

  // Update the component with new users
  update(users: User[]) {
    this.props.users = users;
    this.render();
  }

  // Render the user list table
  render() {
    this.container.innerHTML = '';

    if (this.props.users.length > 0) {
      const table = this.createTable();
      this.container.appendChild(table);
    } else {
      const emptyState = this.createEmptyState();
      this.container.appendChild(emptyState);
    }
  }

  // Create the users table
  private createTable(): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'users-table';

    // Create table header
    const thead = this.createTableHeader();
    table.appendChild(thead);

    // Create table body
    const tbody = this.createTableBody();
    table.appendChild(tbody);

    return table;
  }

  // Create table header
  private createTableHeader(): HTMLTableSectionElement {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['User ID', 'Email', 'Created', 'Actions'];
    headers.forEach((headerText) => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    return thead;
  }

  // Create table body with user rows
  private createTableBody(): HTMLTableSectionElement {
    const tbody = document.createElement('tbody');

    this.props.users.forEach((user) => {
      const row = this.createUserRow(user);
      tbody.appendChild(row);
    });

    return tbody;
  }

  // Create a single user row
  private createUserRow(user: User): HTMLTableRowElement {
    const row = document.createElement('tr');

    // User ID cell
    const idCell = this.createUserIdCell(user);
    row.appendChild(idCell);

    // Email cell
    const emailCell = this.createEmailCell(user);
    row.appendChild(emailCell);

    // Created date cell
    const dateCell = this.createDateCell(user);
    row.appendChild(dateCell);

    // Actions cell
    const actionsCell = this.createActionsCell(user);
    row.appendChild(actionsCell);

    return row;
  }

  // Create user ID cell
  private createUserIdCell(user: User): HTMLTableCellElement {
    const idCell = document.createElement('td');
    const idSpan = document.createElement('span');
    idSpan.className = 'user-id';
    idSpan.textContent = user.uuid.substring(0, 8) + '...';
    idSpan.title = user.uuid; // Show full ID on hover
    idCell.appendChild(idSpan);
    return idCell;
  }

  // Create email cell
  private createEmailCell(user: User): HTMLTableCellElement {
    const emailCell = document.createElement('td');
    emailCell.className = 'user-email';
    emailCell.textContent = user.email;
    return emailCell;
  }

  // Create date cell
  private createDateCell(user: User): HTMLTableCellElement {
    const dateCell = document.createElement('td');
    dateCell.className = 'user-date';
    dateCell.textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : 'Unknown';
    return dateCell;
  }

  // Create actions cell with buttons
  private createActionsCell(user: User): HTMLTableCellElement {
    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const infoBtn = this.createInfoButton(user);
    const removeBtn = this.createRemoveButton(user);

    actionsCell.appendChild(infoBtn);
    actionsCell.appendChild(removeBtn);

    return actionsCell;
  }

  // Create info button
  private createInfoButton(user: User): HTMLButtonElement {
    const infoBtn = document.createElement('button');
    infoBtn.className = 'btn-info';
    infoBtn.textContent = 'Info';
    infoBtn.onclick = () => this.showUserInfo(user);
    return infoBtn;
  }

  // Create remove button
  private createRemoveButton(user: User): HTMLButtonElement {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => this.removeUser(user.uuid);
    return removeBtn;
  }

  // Create empty state display
  private createEmptyState(): HTMLDivElement {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">👥</div>
      <div>No users found</div>
      <div style="font-size: 12px; margin-top: 5px;">Generate a user to get started!</div>
    `;
    return emptyState;
  }

  // Show user information in an alert
  private showUserInfo(user: User): void {
    alert(`User Information:
  
ID: ${user.uuid}
Email: ${user.email}
Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}`);
  }

  // Remove user with confirmation
  private async removeUser(uuid: string): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to remove the user with ID: ${uuid}?`
    );
    if (confirmed) {
      const success = await deleteUser(uuid);
      if (success && this.props.onUserRemoved) {
        this.props.onUserRemoved();
        // Reload the user list after deletion
        console.log(`User with ID ${uuid} removed successfully.`);
        // Update the UI
        this.props.users = this.props.users.filter(
          (user) => user.uuid !== uuid
        );
        this.render();
      }
    }
  }
}

export type { User, UserListProps };

// Default export factory function for the component system
export default function createUserList(
  element: HTMLElement,
  props: UserListProps
): UserList {
  return new UserList(element, props);
}
