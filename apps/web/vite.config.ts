import { defineConfig } from 'vite';
import { env } from './src/env.js';

export default defineConfig(() => {
  return {
    root: 'src',
    server: {
      host: '0.0.0.0',
      port: env.PORT,
      proxy: {
        '/api': {
          target: env.API_SERVER,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/websocket': {
          target: env.SOCKET_SERVER,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/websocket/, ''),
        },
        '/documentation': {
          target: env.SWAGGER_SERVER,
          changeOrigin: true,
          secure: false,
        },
        '/cdn': {
          target: `http://localhost:${process.env.CDN_PORT || 3008}`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/cdn/, ''),
        },
      },
    },
    preview: {
      port: env.PORT,
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      cssCodeSplit: true,
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress CSS-related warnings about Tailwind classes
          if (
            warning.code === 'CSS_UNKNOWN_PSEUDO_CLASS' ||
            warning.message?.includes(
              'is not recognized as a valid pseudo-class'
            ) ||
            warning.message?.includes('pseudo-class') ||
            warning.message?.includes('pseudo-element')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    css: {
      devSourcemap: true,
      // Suppress CSS warnings from lightningcss
      transformer: 'postcss',
    },
    logLevel: 'warn', // Reduce log verbosity
  };
});
