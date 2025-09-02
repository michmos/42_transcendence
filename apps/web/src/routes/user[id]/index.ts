// User profile page specific TypeScript functionality
console.log('User profile page TypeScript loaded!');

// Route initialization function - called by the dynamic route loader with parameters
export function initRoute(params?: { id: string }) {
  console.log('User profile page initialized with params:', params);
  
  // Add user-specific class to the app container when this route loads
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('user-page');
  }

  // Display the user information
  displayUserInfo(params);
  
  // Attach event listeners for user page
  attachUserEventListeners(params);
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
      alert(`User Profile Details:\n\nUser ID: ${userId}\nURL: ${window.location.pathname}\nLoaded: ${new Date().toLocaleString()}`);
    };
  }
  
  // Edit user button
  const editUserBtn = appContainer.querySelector('#editUserBtn') as HTMLElement;
  if (editUserBtn) {
    editUserBtn.onclick = (e) => {
      e.preventDefault();
      const userId = params?.id || 'Unknown';
      alert(`Edit User Demo:\n\nThis would open an edit form for user: ${userId}\n\n(This is just a demo - no actual editing functionality)`);
    };
  }

  console.log('User page event listeners attached for user:', params?.id);
}
