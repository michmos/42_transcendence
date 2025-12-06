import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CDN_PORT: z.coerce.number().default(3008),
    CDN_PATH: z.string().nonempty('CDN_PATH is required'),
  },

  runtimeEnv: process.env,
});
