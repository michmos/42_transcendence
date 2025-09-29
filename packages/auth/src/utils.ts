export interface OpenID {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface GithubUser {
  login: string;
  id: number;
  email: string;
  node_id: string;
  avatar_url: string;
}

export interface FourtyTwoUser {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  image: {
    link: string;
  };
}

// Fetch user info from GitHub API
async function fetchGithubUser(token: string) {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!userResponse.ok) {
    throw new Error(
      `Failed to fetch user info from GitHub API: ${userResponse.statusText}`
    );
  }

  const userData = await userResponse.json();

  // Get email from the user data or fetch primary email if not public
  if (!userData.email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(
        (email: { primary: string; verified: string }) =>
          email.primary && email.verified
      );
      if (primaryEmail) {
        userData.email = primaryEmail.email;
      }
    }
  }
  return userData as GithubUser;
}

// Fetch user info from 42 API
async function fetch42User(token: string) {
  const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error(
      `Failed to fetch user info from 42 API: ${userResponse.statusText}`
    );
  }
  const userData = await userResponse.json();
  return userData as FourtyTwoUser;
}

export { fetchGithubUser, fetch42User };
