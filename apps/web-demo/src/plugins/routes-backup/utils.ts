// Route utilities and helper functions

// Define type for global Components object
interface GlobalComponents {
  refresh: () => void;
}

// Helper function to render content into the app container
export function renderContent(html: string) {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = html;
  } else {
    document.body.innerHTML = html;
  }

  // Trigger component system refresh after content is rendered
  setTimeout(() => {
    // Check if global component system is available
    const globalComponents = (window as { Components?: GlobalComponents })
      .Components;
    if (globalComponents && typeof globalComponents.refresh === 'function') {
      console.log('🔄 Refreshing component system after route content loaded');
      globalComponents.refresh();
    } else {
      // Fallback: dispatch event for component system
      console.log(
        '🔄 Dispatching component system refresh event after route content loaded'
      );
      window.dispatchEvent(new CustomEvent('componentSystemRefresh'));
    }
  }, 50); // Small delay to ensure DOM is updated
}

// Helper function to load HTML content (generic utility)
export async function loadHtmlContent(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading HTML content:', error);
    return '<h1>Error loading page content</h1>';
  }
}
