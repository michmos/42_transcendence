import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server:
	{
		API_URL: z.string().default('http://localhost'),
		API_PORT: z.coerce.number().default(3000)
	},
	
	runtimeEnv: process.env
});