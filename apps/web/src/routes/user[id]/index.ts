import API from '../../plugins/api/index.js';

export default function initRoute() {
  // Get the ID from the route parameters that were injected by the router
  const routeParams = window.routeParams;
  const userId = routeParams?.id || 'unknown';

  // If no valid userId, show error
  if (!routeParams?.id || userId === 'unknown') {
    console.error('❌ No valid user ID found in route parameters');
    const userDetailsContainer = document.getElementById('userDetails');
    if (userDetailsContainer) {
      userDetailsContainer.innerHTML = `
        <h2>Error</h2>
        <p>No valid user ID provided.</p>
        <a href="/" data-link>← Back to Home</a>
      `;
    }
    return;
  }

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    void (async () => {
      console.log(`🌐 Fetching user data for ID: ${userId}`);

      // Fetch and display user details
      const user = await API.getUserById(userId);
      if (!user) {
        console.error(`❌ User with ID ${userId} not found`);
        return alert(`User with ID ${userId} not found.`);
      }

      console.log('✅ User data loaded:', user);

      const userDetailsContainer = document.getElementById('userDetails');
      if (userDetailsContainer) {
        userDetailsContainer.innerHTML = `
        <h2>User Details</h2>
        <p><strong>UUID:</strong> ${user.uuid}</p>
        <p><strong>NickName:</strong> ${user.nickname}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <button id="deleteUserBtn">Delete User</button>
      `;
        // Re-attach event listeners after injecting HTML
        attachUserEventListeners(userId);
        console.log('✅ User interface setup complete');
      }
    })();
  }, 100); // Increased delay to ensure everything is ready
}

// Helper function to attach event listeners for user page
function attachUserEventListeners(userId: string) {
  // Use event delegation for dynamically loaded content
  const appContainer = document.getElementById('app') || document.body;

  // Show user details button
  const deleteUserBtn = appContainer.querySelector(
    '#deleteUserBtn'
  ) as HTMLElement;
  if (deleteUserBtn) {
    deleteUserBtn.onclick = (e) => {
      e.preventDefault();
      API.deleteUser(userId)
        .then(() => {
          if (window.router) {
            window.router.navigate('/');
          } else {
            console.warn(
              '⚠️ Router instance not found. Cannot navigate after deletion.'
            );
          }
        })
        .catch((error: unknown) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user. Please try again.');
        });
    };
  }

  console.log('User page event listeners attached for user:', userId);
}
