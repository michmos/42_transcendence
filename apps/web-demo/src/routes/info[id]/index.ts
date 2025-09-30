// Declare the routeParams variable that will be injected by the router
declare const routeParams: { id: string } | undefined;

// Log the route parameters for debugging
console.log('Route params available:', routeParams);

// Get the ID from the route parameters that were injected by the router
const id = routeParams?.id || 'unknown';

// Add info-specific class to the app container when this route loads for styling
const appContainer = document.getElementById('app');
if (appContainer) {
  appContainer.classList.add('info-page');
}

// Display the route information
displayRouteInfo();

// Function to display route information
function displayRouteInfo() {
  const currentUrl = window.location.pathname;
  const loadTime = new Date().toLocaleTimeString();

  // Update the info display elements
  const currentUrlElement = document.getElementById('current-url');
  const loadTimeElement = document.getElementById('load-time');

  if (currentUrlElement) currentUrlElement.textContent = currentUrl;
  if (loadTimeElement) loadTimeElement.textContent = loadTime;

  console.log('Route Info Display Updated:', {
    currentUrl,
    routeId: id,
    loadTime,
  });
}
