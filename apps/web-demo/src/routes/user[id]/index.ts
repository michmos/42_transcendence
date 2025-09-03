import {
  getUsers,
  generateUser,
  deleteUser,
} from '../../plugins/fetch/index.js';

interface RouteParameters {
  params: string[];
  path: string;
}

// User profile page specific TypeScript functionality
console.log('User profile page TypeScript loaded!');

// Route initialization function - called by the dynamic route loader with parameters
export default function UserRoute(params: RouteParameters) {
  console.log('User route parameters:', params);

  // Extract user ID from params
  const userId = params.params[0] || 'unknown';

  document.getElementById('get-users')?.addEventListener('click', async () => {
    try {
      await getUsers();
      alert('Users loaded in the list below!');
    } catch (error) {
      console.error('Error getting users:', error);
      alert('Failed to get users');
    }
  });

  document
    .getElementById('create-user')
    ?.addEventListener('click', async () => {
      try {
        await generateUser();
        alert('New user created and list updated!');
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user');
      }
    });

  document
    .getElementById('delete-user')
    ?.addEventListener('click', async () => {
      try {
        await deleteUser(userId);
        alert(`User ${userId} deleted!`);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    });

  // Display user information
  displayUserInfo({ id: userId });

  // Attach event listeners
  attachUserEventListeners({ id: userId });
}

// Function to display user information
function displayUserInfo(params?: { id: string }) {
  const currentUrl = window.location.pathname;
  const userId = params?.id || 'No user ID provided';
  const loadTime = new Date().toLocaleTimeString();

  // Update the user display elements
  const currentUrlElement = document.getElementById('current-url');
  const userIdElement = document.getElementById('user-id');
  const loadTimeElement = document.getElementById('load-time');

  if (currentUrlElement) currentUrlElement.textContent = currentUrl;
  if (userIdElement) userIdElement.textContent = userId;
  if (loadTimeElement) loadTimeElement.textContent = loadTime;

  console.log('User Info Display Updated:', { currentUrl, userId, loadTime });
}

// Helper function to attach event listeners for user page
function attachUserEventListeners(params?: { id: string }) {
  // Use event delegation for dynamically loaded content
  const appContainer = document.getElementById('app') || document.body;

  // Show user details button
  const showUserBtn = appContainer.querySelector('#showUserBtn') as HTMLElement;
  if (showUserBtn) {
    showUserBtn.onclick = (e) => {
      e.preventDefault();
      const userId = params?.id || 'Unknown';
      alert(
        `User Profile Details:\n\nUser ID: ${userId}\nURL: ${window.location.pathname}\nLoaded: ${new Date().toLocaleString()}`
      );
    };
  }

  // Edit user button
  const editUserBtn = appContainer.querySelector('#editUserBtn') as HTMLElement;
  if (editUserBtn) {
    editUserBtn.onclick = (e) => {
      e.preventDefault();
      const userId = params?.id || 'Unknown';
      alert(
        `Edit User Demo:\n\nThis would open an edit form for user: ${userId}\n\n(This is just a demo - no actual editing functionality)`
      );
    };
  }

  console.log('User page event listeners attached for user:', params?.id);
}
