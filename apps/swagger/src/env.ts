import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    SWAGGER_PORT: z.coerce.number().default(3002),
  },

  runtimeEnv: process.env,
});
