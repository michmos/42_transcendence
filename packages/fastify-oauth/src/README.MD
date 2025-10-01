
# Auth Plugin

This plugin provides OAuth2 authentication for Fastify applications, supporting providers like Google, GitHub, and 42. It manages user sessions using JWTs and HTTP-only cookies, and exposes endpoints for login, callback, session management, and logout.

## Features

- OAuth2 authentication for multiple providers (Google, GitHub, 42)
- JWT-based session management
- HTTP-only cookies for secure sessions
- Easy provider configuration
- Extensible with custom callbacks

## Setup

1. **Obtain OAuth Credentials:**
   - For Google: Get CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Enable the People API: [Enable here](https://console.cloud.google.com/apis/library/people.googleapis.com).
   - For GitHub/42: Register your app and obtain credentials from their respective developer portals.

2. **Environment Variables:**
   Set the following in your environment:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL`
   - `JWT_SECRET` (use a strong, random string)

3. **Register the Plugin:**

   ```typescript
   import AuthPlugin from './plugins/auth';

   const auth = AuthPlugin(
     app,
     process.env.GOOGLE_REDIRECT_URL,
     process.env.JWT_SECRET
   );
   auth.addProvider('google', ['profile', 'email'], {
     client: {
       id: process.env.GOOGLE_CLIENT_ID,
       secret: process.env.GOOGLE_CLIENT_SECRET,
     },
     auth: {
       tokenHost: 'https://accounts.google.com',
       tokenPath: '/o/oauth2/token',
       authorizePath: '/o/oauth2/auth',
     },
   });
   // Add other providers similarly
   ```

## Endpoints

### `GET /auth/providers`

Returns a list of available OAuth providers.

### `GET /auth/:provider/login`

Returns the OAuth authorization URL for the specified provider.

### `GET /auth/:provider/callback`

Handles the OAuth callback, exchanges code for tokens, sets session cookie, and redirects to `/`.

### `GET /auth/session`

Returns the current authenticated user (refreshes token if needed).

### `GET /auth/logout`

Clears the session cookie and logs out the user.

## Usage Notes

- The plugin uses JWTs for session management. The JWT is stored in an HTTP-only cookie named `session`.
- The plugin supports custom callbacks via the `.on('userUpdated', callback)` method.
- For production, ensure all secrets are strong and secure, and use HTTPS.

## Extending Providers

To add a new OAuth provider, use the `addProvider` method with the provider's name, scopes, and OAuth2 options.

## Example: Adding GitHub Provider

```typescript
auth.addProvider('github', ['user', 'user:email'], {
  client: {
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize',
  },
});
```

## License

MIT
