// Info page specific TypeScript functionality
console.log('Info page TypeScript loaded!');

// Route initialization function - called by the dynamic route loader with parameters
export function initRoute(params?: { id: string }) {
  console.log('Info page initialized with params:', params);
  
  // Add info-specific class to the app container when this route loads
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.classList.add('info-page');
  }

  // Display the route information
  displayRouteInfo(params);
  
  // Attach event listeners for info page
  attachInfoEventListeners(params);
}

// Function to display route information
function displayRouteInfo(params?: { id: string }) {
  const currentUrl = window.location.pathname;
  const routeId = params?.id || 'No ID provided';
  const loadTime = new Date().toLocaleTimeString();
  
  // Update the info display elements
  const currentUrlElement = document.getElementById('current-url');
  const routeIdElement = document.getElementById('route-id');
  const loadTimeElement = document.getElementById('load-time');
  
  if (currentUrlElement) currentUrlElement.textContent = currentUrl;
  if (routeIdElement) routeIdElement.textContent = routeId;
  if (loadTimeElement) loadTimeElement.textContent = loadTime;
  
  console.log('Route Info Display Updated:', { currentUrl, routeId, loadTime });
}

// Helper function to attach event listeners for info page
function attachInfoEventListeners(params?: { id: string }) {
  // Use event delegation for dynamically loaded content
  const appContainer = document.getElementById('app') || document.body;
  
  // Show ID button
  const showIdBtn = appContainer.querySelector('#showIdBtn') as HTMLElement;
  if (showIdBtn) {
    showIdBtn.onclick = (e) => {
      e.preventDefault();
      const id = params?.id || 'No ID';
      alert(`Current Info Page ID: ${id}\n\nURL: ${window.location.pathname}`);
    };
  }
  
  // Change ID button
  const changeIdBtn = appContainer.querySelector('#changeIdBtn') as HTMLElement;
  if (changeIdBtn) {
    changeIdBtn.onclick = (e) => {
      e.preventDefault();
      // Navigate to a different ID
      const newId = '456';
      const newUrl = `/info/${newId}`;
      
      // Use the router's navigate method if available
      if ((window as any).router && (window as any).router.navigate) {
        (window as any).router.navigate(newUrl);
      } else {
        // Fallback to manual navigation
        window.history.pushState(null, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
  }

  console.log('Info page event listeners attached for ID:', params?.id);
}
