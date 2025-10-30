import type { OAuthProvider } from '../server/index.js';

async function fetchSessionData(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });

    // TODO: use standard error handler here!
    if (response.status === 400) {
      const json = await response.json();
      if (json && json.error) {
        const error = json.error.message;
        const code = json.error.status;
        window.location.href = `/error?error=${error}&code=${code}`;
        return null;
      }
    }

    if (response.status === 200) {
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (!data || !data.uuid) {
        return null;
      }
      return data.uuid;
    }
    return null;
  } catch {
    console.error('Error fetching session data');
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
  const uuid = await fetchSessionData();
  const providers = (await getAuthProviders()) as OAuthProvider[] | null;

  if (!providers || providers.length === 0) {
    console.error('❌ No authentication providers configured');
    authContainer.style.display = 'none';
    return;
  }
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '10px';

  authContainer.appendChild(buttonContainer);

  function addButtonForProvider(
    provider: { name: string; buttonUri: string },
    container: HTMLDivElement,
    session: string | null
  ) {
    const button = document.createElement('button');
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';

    if (session) {
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
        window.location.href = provider.buttonUri;
      });
    }

    container.appendChild(button);
  }

  // Clear existing buttons
  buttonContainer.innerHTML = '';

  if (uuid) {
    return addLogoutButton(buttonContainer, uuid);
  }

  function addLogoutButton(container: HTMLDivElement, uuid: string) {
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout ' + uuid;
    logoutButton.style.padding = '10px 20px';
    logoutButton.style.fontSize = '16px';
    logoutButton.style.cursor = 'pointer';

    logoutButton.addEventListener('click', async () => {
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

    container.appendChild(logoutButton);
  }

  // Add buttons for each provider
  for (const provider of providers) {
    addButtonForProvider(provider, buttonContainer, uuid);
  }
}

export default initializeLoginButtons;
export { fetchSessionData };
