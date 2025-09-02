// Root page specific TypeScript functionality
console.log('Root page TypeScript loaded!');

// Route initialization function - called by the dynamic route loader
export function initRoute() {
  console.log('Root page initialized');
  
  // Add root-specific class to the app container when this route loads
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('root-page');
  }

  // Attach event listeners for root page buttons
  attachRootEventListeners();
  
  // Load users on page load (root page specific functionality)
  (window as any).getUsers();
}

// Helper function to attach event listeners for root page
function attachRootEventListeners() {
  // Use event delegation for dynamically loaded content
  const appContainer = document.getElementById('app') || document.body;
  
  // Remove existing listeners to prevent duplicates
  const existingGetUsersBtn = appContainer.querySelector('#getUsersBtn') as HTMLElement;
  const existingMakeUserBtn = appContainer.querySelector('#makeUserBtn') as HTMLElement;
  const existingDelUserBtn = appContainer.querySelector('#delUserBtn') as HTMLElement;
  
  if (existingGetUsersBtn) existingGetUsersBtn.onclick = (e) => {
    e.preventDefault();
    (window as any).getUsers();
  };
  if (existingMakeUserBtn) existingMakeUserBtn.onclick = (e) => {
    e.preventDefault();
    (window as any).makeUser();
  };
  if (existingDelUserBtn) existingDelUserBtn.onclick = (e) => {
    e.preventDefault();
    (window as any).deleteUser();
  };

  // Add some root-specific functionality
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      console.log('Button hovered:', button.textContent);
    });
  });
}
