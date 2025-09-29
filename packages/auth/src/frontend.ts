interface OAuthProvider {
  name: string;
  buttonUri: string;
}

// Fetch sessionData from the backend by sending the session cookie to the server
async function fetchSessionData(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.user;
    } else {
      return null;
    }
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
  const session = await fetchSessionData();
  console.log('Session data:', session);
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
        console.log('provider:', provider);
        console.log(`Redirecting to ${provider.name} login...`);
        console.log(`Redirect URL: ${provider.buttonUri}`);
        console.log(
          `Full URL: ${window.location.origin}/${provider.buttonUri}`
        );
        // Redirect to the provider's login URL
        window.location.href = provider.buttonUri;
        // const loginUrl = await fetchAuthUrl(provider.buttonUri);
        // if (loginUrl) {
        //   // Redirect to Google login
        //   window.location.href = loginUrl;
        // } else {
        //   console.error('❌ Failed to get Google login URL');
        //   alert('Failed to get Google login URL. Please try again later.');
        // }
      });
    }

    container.appendChild(button);
  }

  // Clear existing buttons
  buttonContainer.innerHTML = '';

  // Add buttons for each provider
  for (const provider of providers) {
    addButtonForProvider(provider, buttonContainer, session);
  }
}

export default initializeLoginButtons;
