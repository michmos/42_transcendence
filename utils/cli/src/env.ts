import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    HOST_NAME: z.string().default('localhost'),
    HOST_PORT: z.string().default('3000'),
  },

  runtimeEnv: process.env,
});
