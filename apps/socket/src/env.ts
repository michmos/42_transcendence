import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.string().nonempty('API_URL is required'),
    SOCKET_PORT: z.coerce.number().default(3001),
    ADMIN_API_KEY: z.string().nonempty('ADMIN_API_KEY is required'),
  },

  runtimeEnv: process.env,
});
