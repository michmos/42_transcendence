// Get the Google login URL from the backend
async function fetchGoogleAuthUrl(): Promise<string | null> {
  try {
    const response = await fetch('/api/googleAuth/login');
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
    const response = await fetch('/api/googleAuth/session', {
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

// Setup the Google Auth button functionality
async function setupGoogleAuthButton() {
  const googleLoginBtn = document.getElementById(
    'googleLoginBtn'
  ) as HTMLButtonElement | null;

  if (!googleLoginBtn) {
    console.error('❌ id: googleLoginBtn not found in DOM');
    return;
  }

  // Check if user is already logged in
  const user = await fetchUserSession();

  // Update button text based on login state
  if (user) {
    googleLoginBtn.textContent = 'Logout ' + user;
  } else {
    googleLoginBtn.textContent = 'Login with Google';
  }

  // Add click event listener to the button
  googleLoginBtn.addEventListener('click', async () => {
    if (user) {
      await fetch('/api/googleAuth/logout', {
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
      return;
    }

    const loginUrl = await fetchGoogleAuthUrl();
    if (loginUrl) {
      // Redirect to Google login
      window.location.href = loginUrl;
    } else {
      console.error('❌ Failed to get Google login URL');
      alert('Failed to get Google login URL. Please try again later.');
    }
  });
}

export { setupGoogleAuthButton };
