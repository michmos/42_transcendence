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
  // Add about-specific functionality
  const appContainer = document.getElementById('app') || document.body;
  if (appContainer) {
    appContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'H1') {
        console.log('About page title clicked!');
      }
    });
  }
}
