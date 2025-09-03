import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    SOCKET_URL: z.string().default('wss://localhost'),
    SOCKET_PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().optional(),
  },

  runtimeEnv: process.env,
});
