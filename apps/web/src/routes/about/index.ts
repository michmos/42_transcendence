// About page specific TypeScript functionality
console.log('About page TypeScript loaded!');

// Route initialization function - called by the dynamic route loader
export function initRoute() {
  console.log('About page initialized');
  
  // Add about-specific class to the app container when this route loads
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('about-page');
  }

  // Attach event listeners for about page
  attachAboutEventListeners();
}

// Helper function to attach event listeners for about page
function attachAboutEventListeners() {
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

  // Add about-specific functionality
  const aboutContainer = appContainer;
  if (aboutContainer) {
    aboutContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'H1') {
        console.log('About page title clicked!');
      }
    });
  }
}
