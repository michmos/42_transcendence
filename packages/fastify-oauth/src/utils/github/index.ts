import { env } from '../../env.js';
interface GithubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  email: string;
  location: string;
  hireable: boolean;
  bio: string;
  twitter_nickname: string;
  VITE_repos: number;
  VITE_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface GithubEmails {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

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

  const userData = (await userResponse.json()) as GithubUser;

  // Get email from the user data or fetch primary email if not public
  if (!userData.email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as GithubEmails[];
      const primaryEmail = emails.find(
        (email: { primary: boolean; verified: boolean; email: string }) =>
          email.primary && email.verified
      );
      if (primaryEmail) {
        userData.email = primaryEmail.email;
      }
    }
  }

  const user = {
    uuid: userData.id,
    nickname: userData.name,
    email: userData.email,
    avatar: userData.avatar_url,
  };

  return user;
}

import type { OAuthProviderOptions } from '../../index.js';

const GitHub: OAuthProviderOptions = {
  name: 'GitHub',
  client: {
    id: env.GITHUB_CLIENT_ID || '',
    secret: env.GITHUB_CLIENT_SECRET || '',
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize',
  },
  scopes: ['read:user', 'user:email', 'offline_access'],
  fetchUserData: fetchGithubUser,
};

export { GitHub };
