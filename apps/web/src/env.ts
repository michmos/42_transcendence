import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.string().default('http://localhost:3000'),
  },
  server: {
    PORT: z.coerce.number().default(5173),
    API_SERVER: z.string().default('http://localhost:3000'),
    SOCKET_SERVER: z.string().default('ws://localhost:3001'),
    SWAGGER_SERVER: z.string().default('http://localhost:3000/documentation'),
  },
  runtimeEnv: import.meta.env,
});
