import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.string().default('http://localhost'),
    API_PORT: z.coerce.number().default(3002),
    DATABASE_URL: z.string().optional(),

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

    UUID_ENCRYPTION_KEY: z
      .string()
      .min(32, 'UUID_ENCRYPTION_KEY must be at least 32 characters long')
      .max(32, 'UUID_ENCRYPTION_KEY must be at most 32 characters long')
      .nonempty('UUID_ENCRYPTION_KEY is required'),
  },

  runtimeEnv: process.env,
});
