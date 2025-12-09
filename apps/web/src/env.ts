import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(5173),
    CDN_SERVER: z.coerce.string().default('http://localhost:3008'),
    API_SERVER: z.string().default('http://localhost:3002'),
    SOCKET_SERVER: z.string().default('http://localhost:3001'),
    SWAGGER_SERVER: z.string().default('http://localhost:3003'),
  },
  runtimeEnv: import.meta.env,
});
