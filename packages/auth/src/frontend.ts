interface OAuthProvider {
  name: string;
  buttonUri: string;
}

// Get the Google login URL from the backend
async function fetchAuthUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
    const data: { url: string } = await response.json();
    return data.url;
  } catch (error: unknown) {
    console.error('Error fetching login URL:', error);
    return null;
  }
}

// Fetch the current user session from the backend by sending the session cookie to the server
async function fetchUserSession(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });

    const data: { user: string } = await response.json();
    return data.user;
  } catch (error: unknown) {
    console.error('Error fetching session data:', error);
    return null;
  }
}

async function getAuthProviders(): Promise<string[] | null> {
  try {
    const response = await fetch('/api/auth/providers', {
      method: 'GET',
      credentials: 'include',
    });

    const data: { providers: string[] } = await response.json();
    return data.providers;
  } catch (error: unknown) {
    console.error('Error fetching auth providers:', error);
    return null;
  }
}

// Setup the Google Auth button functionality
async function initializeLoginButtons() {
  const authContainer = document.getElementById(
    'authContainer'
  ) as HTMLButtonElement | null;

  if (!authContainer) {
    console.error('❌ <div id="authContainer"></div> not found in DOM');
    return;
  }

  // Check if user is already logged in
  const user = await fetchUserSession();
  const providers = (await getAuthProviders()) as OAuthProvider[] | null;

  if (!providers || providers.length === 0) {
    console.error('❌ No authentication providers configured');
    authContainer.style.display = 'none';
    return;
  }
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';

  authContainer.appendChild(buttonContainer);

  function addButtonForProvider(
    provider: { name: string; buttonUri: string },
    container: HTMLDivElement,
    user: string | null
  ) {
    const button = document.createElement('button');
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';

    if (user) {
      button.textContent = `Logout ${provider.name}`;
      button.addEventListener('click', async () => {
        await fetch(`/api/auth/logout`, {
          method: 'GET',
          credentials: 'include',
        })
          .then(() => {
            window.location.reload();
          })
          .catch((error) => {
            console.error('❌ Logout failed:', error);
            alert('Logout failed. Please try again.');
          });
      });
    } else {
      button.textContent = `Login with ${provider.name}`;
      button.addEventListener('click', async () => {
        const loginUrl = await fetchAuthUrl(provider.buttonUri);
        if (loginUrl) {
          // Redirect to Google login
          window.location.href = loginUrl;
        } else {
          console.error('❌ Failed to get Google login URL');
          alert('Failed to get Google login URL. Please try again later.');
        }
      });
    }

    container.appendChild(button);
  }

  // Clear existing buttons
  buttonContainer.innerHTML = '';

  // Add buttons for each provider
  for (const provider of providers) {
    addButtonForProvider(provider, buttonContainer, user);
  }
}

export default initializeLoginButtons;
