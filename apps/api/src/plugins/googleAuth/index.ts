/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 *
 * Make sure the people API is enabled for your project to get the user profile information.
 * You can enable it from https://console.cloud.google.com/apis/library/people.googleapis.com
 *
 * The REDIRECT_URI is the URL to which users will be redirected after they have authenticated with Google.
 * This URL must be registered in the Google Cloud Console.
 * For development purposes, you can use http://localhost:3000/api/auth/google/callback
 * For production, use your actual domain, e.g., https://yourdomain.com/api/auth/google/callback
 *
 * Make sure the Application is set to production or add test users if it's in testing mode.
 *
 * The JWT_SECRET is used to sign the JWT tokens. Make sure to use a strong, random string in a production environment.
 *
 * The FRONTEND_URL is the URL of your frontend application where users will be redirected after successful authentication.
 *
 * The GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, JWT_SECRET, and FRONTEND_URL should be set in your environment variables.
 *
 */

import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';
import GoogleAPI from 'googleapis';
import jwt from 'jsonwebtoken';
import fastifyCookie from '@fastify/cookie';

const { google } = GoogleAPI;
const person = google.people('v1');

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URL
);

// Set the credentials globally for all Google API requests
google.options({ auth: oauth2Client });

// async function refreshAccessToken(refresh_token: string): Promise<string> {
//   oauth2Client.setCredentials({ refresh_token });
//   return oauth2Client.getAccessToken().then((response) => {
//     const accessToken =
//       typeof response === 'string' ? response : response?.token;
//     if (!accessToken) {
//       throw new Error('Failed to refresh access token');
//     }
//     return accessToken;
//   });
// }

export default async function (app: FastifyInstance): Promise<void> {
  // Register cookie plugin
  app.register(fastifyCookie);

  // API endpoint to get Google OAuth login URL
  app.get('/login', async (request, reply) => {
    request.log.info('Generating Google OAuth URL');

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      prompt: 'consent',
    });

    // Send the authorization URL to the client as a JSON response
    reply.send({ url: authorizeUrl });
  });

  // OAuth2 callback endpoint
  app.get('/callback', async (request, reply) => {
    const { code } = request.query as { code: string };

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Check if access_token and refresh_token are present
      if (!tokens.access_token) {
        return reply
          .status(400)
          .send({ error: 'ID token not found in response' });
      }

      if (!tokens.refresh_token) {
        return reply
          .status(400)
          .send({ error: 'Refresh token not found in response' });
      }

      // Retrieve user info
      const idInfo = await oauth2Client.getTokenInfo(tokens.access_token);
      if (!idInfo.email) {
        return reply
          .status(400)
          .send({ error: 'Failed to retrieve user email' });
      }
      const email = idInfo.email;

      // Retrieve additional user profile information
      const profileResponse = await person.people.get({
        resourceName: 'people/me',
        personFields: 'names',
      });

      const names = profileResponse.data.names;

      const username =
        names && names.length > 0 && names[0] ? names[0].displayName : '';

      // TODO: Look up the user in your database and create a new user record if they don't exist.
      // Lets do this with a callback in the server so the plugin is not dependent on the database structure

      request.log.info(`User Info: ${JSON.stringify({ username })}`);

      // Create JWT token with the UUID and refresh token
      const jwtToken = jwt.sign(
        { email, refresh_token: tokens.refresh_token },
        env.JWT_SECRET,
        { expiresIn: '7d' } // token valid for 7 day
      );

      // Set JWT in HTTP-only cookie
      reply.setCookie('session', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      reply.redirect(`${env.FRONTEND_URL}`);
    } catch (error) {
      console.error('Error during Google OAuth callback:', error);
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  app.get('/session', async (request, reply) => {
    const { session } = request.cookies as { session?: string };
    if (!session) {
      return reply.status(200).send({ user: null });
    }

    try {
      const decoded = jwt.verify(session, env.JWT_SECRET) as {
        // TODO: change to uuid and keep email and username only in DB
        email: string;
        refresh_token: string;
      };

      // TODO: refresh the access token using the refresh token to update user info from Google
      // TODO: return the uuid from the database
      return reply.status(200).send({ user: decoded.email });
    } catch (error) {
      console.error('Error verifying JWT:', error);
      return reply.status(200).send({ user: null });
    }
  });

  // Logout endpoint to clear the session cookie
  app.get('/logout', async (request, reply) => {
    reply.clearCookie('session', { path: '/' });
    // Make sure to refresh the frontend state as well
    return reply.status(200).send({ message: 'Logged out' });
  });
}
