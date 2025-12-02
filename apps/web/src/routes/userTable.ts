import API from '../plugins/api/index.js';

function showError(error: unknown) {
  const errorMessage = document.getElementById('errorMessage');

  if (errorMessage) {
    errorMessage.textContent =
      'Error generating user: ' +
      (error instanceof Error ? error.message : String(error));
  }
  if (errorMessage) errorMessage.style.display = 'block';
}

function hideError() {
  const errorMessage = document.getElementById('errorMessage');
  if (errorMessage) errorMessage.style.display = 'none';
}

function createUserRow(user: {
  uuid: string;
  nickname: string | null;
  email: string;
}) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${user.uuid}</td>
    <td>${user.nickname}</td>
    <td>${user.email}</td>
    <td>
      <a href="/user/${user.uuid}" data-link>Details</a>
    </td>
  `;

  const detailsBtn = row.querySelector<HTMLButtonElement>('.details-btn');

  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => {
      window.router.navigate(`/user/${user.uuid}`);
    });
  }

  return row;
}

function userTableLogic() {
  console.log('📊 Starting userTableLogic...');

  const usersTable = document.getElementById(
    'usersTable'
  ) as HTMLTableElement | null;
  if (!usersTable) {
    console.error('❌ usersTable not found in userTableLogic');
    return;
  }

  const tbody = usersTable.querySelector('tbody');
  if (!tbody) {
    console.error('❌ tbody not found in usersTable');
    return;
  }

  console.log('✅ Table elements found, clearing existing rows...');
  // Clear existing rows
  tbody.innerHTML = '';

  console.log('🌐 Fetching users from API...');
  // Fetch and display users
  API.getUsers()
    .then((users) => {
      console.log('✅ Users fetched:', users.length, 'users');
      users.forEach((user, index) => {
        console.log(`➕ Adding user ${index + 1}:`, user.nickname);
        const row = createUserRow(user);
        tbody.appendChild(row);
      });
      console.log('✅ All users added to table');
    })
    .catch((error) => {
      console.error('❌ Error fetching users:', error);
      showError(error);
    });
}

function generateUserLogic() {
  console.log('🔧 Starting generateUserLogic...');

  const makeUserBtn = document.getElementById('makeUserBtn');
  if (!makeUserBtn) {
    console.error('❌ makeUserBtn not found');
    return;
  }

  // Remove any existing event listeners by cloning the button
  const newMakeUserBtn = makeUserBtn.cloneNode(true) as HTMLElement;
  makeUserBtn.parentNode?.replaceChild(newMakeUserBtn, makeUserBtn);

  console.log('✅ makeUserBtn found, adding click listener...');
  newMakeUserBtn.addEventListener('click', () => {
    void (async () => {
      console.log('🚀 Generate user button clicked');
      const loadingIndicator = document.getElementById('loadingIndicator');
      const errorMessage = document.getElementById('errorMessage');
      if (loadingIndicator) loadingIndicator.style.display = 'block';
      if (errorMessage) errorMessage.style.display = 'none';

      try {
        const newUser = await API.generateUser();
        if (!newUser) {
          if (loadingIndicator) loadingIndicator.style.display = 'none';
          if (errorMessage) {
            errorMessage.textContent = 'No user data returned from API';
            errorMessage.style.display = 'block';
          }
          return;
        }
        console.log('Generated user:', newUser);

        const usersTable = document.getElementById(
          'usersTable'
        ) as HTMLTableElement | null;
        if (usersTable) {
          const tbody = usersTable.querySelector('tbody');
          if (tbody) {
            const row = createUserRow(newUser);
            tbody.appendChild(row);
          }
        }
      } catch (error) {
        showError(error);
      } finally {
        hideError();
      }
    })();
  });
}

export { userTableLogic, generateUserLogic };
