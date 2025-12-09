import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(5173),
    CDN_SERVER: z.coerce.string().nonempty('CDN_SERVER is required'),
    API_SERVER: z.string().nonempty('API_SERVER is required'),
    SOCKET_SERVER: z.string().nonempty('SOCKET_SERVER is required'),
    SWAGGER_SERVER: z.string().default('http://localhost:3000/documentation'),
  },
  runtimeEnv: import.meta.env,
});
