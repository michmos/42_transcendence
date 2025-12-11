import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CORS_URL: z
      .string()
      .nonempty()
      .describe('The URL allowed for CORS requests'),
  },

  runtimeEnv: process.env,
});
