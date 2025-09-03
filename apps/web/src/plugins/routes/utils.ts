// Route utilities and helper functions

// Helper function to render content into the app container
export function renderContent(html: string) {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = html;
  } else {
    document.body.innerHTML = html;
  }
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
