import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.string().default('http://localhost'),
    API_PORT: z.coerce.number().default(3002),
    DATABASE_URL: z.string().optional(),

    FRONTEND_URL: z.string().nonempty('FRONTEND_URL is required'),
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
    REDIRECT_URL: z.string().nonempty('GOOGLE_REDIRECT_URL is required'),
    JWT_SECRET: z.string().nonempty('JWT_SECRET is required'),
  },

  runtimeEnv: process.env,
});
