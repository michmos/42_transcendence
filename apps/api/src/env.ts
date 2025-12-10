import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_PORT: z.coerce.number().default(3000),
    SOCKET_SERVER: z.string().default('http://localhost:3001'),

    CORS_URL: z.string().nonempty('CORS_URL is required'),
    REDIRECT_URL: z.string().nonempty('REDIRECT_URL is required'),

    CDN_PATH: z.string().nonempty('CDN_PATH is required'),

    ADMIN_API_KEY: z.string().nonempty('ADMIN_API_KEY is required'),
    JWT_SECRET: z.string().nonempty('JWT_SECRET is required'),

    GOOGLE_CLIENT_ID: z.string().nonempty('GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z
      .string()
      .nonempty('GOOGLE_CLIENT_SECRET is required'),
    FORTYTWO_CLIENT_ID: z.string().nonempty('FORTYTWO_CLIENT_ID is required'),
    FORTYTWO_CLIENT_SECRET: z
      .string()
      .nonempty('FORTYTWO_CLIENT_SECRET is required'),
    GITHUB_CLIENT_ID: z.string().nonempty('GITHUB_CLIENT_ID is required'),
    GITHUB_CLIENT_SECRET: z
      .string()
      .nonempty('GITHUB_CLIENT_SECRET is required'),
  },

  runtimeEnv: process.env,
});
