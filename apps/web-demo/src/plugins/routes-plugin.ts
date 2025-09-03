// SPA Routes Plugin for Vite
// This plugin creates route directories and copies index.html for SPA support

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function createRoutesPlugin(): Plugin {
  return {
    name: 'spa-routes-plugin',
    writeBundle() {
      // After build, copy index.html to route paths for SPA support
      const outDir = path.resolve(process.cwd(), 'out');
      const indexPath = path.join(outDir, 'index.html');

      if (!fs.existsSync(indexPath)) {
        console.warn('⚠️ index.html not found in output directory');
        return;
      }

      // Dynamically discover routes from src/routes directory
      const routesDir = path.resolve(process.cwd(), 'src/routes');

      if (!fs.existsSync(routesDir)) {
        console.warn('⚠️ src/routes directory not found');
        return;
      }

      const routes: string[] = [];

      // Read all directories in src/routes
      const entries = fs.readdirSync(routesDir, { withFileTypes: true });

      entries.forEach((entry) => {
        if (entry.isDirectory()) {
          let routeName = entry.name;

          // Handle dynamic routes: convert [id] syntax to base route
          // e.g., "user[id]" becomes "user", "info[id]" becomes "info"
          if (routeName.includes('[') && routeName.includes(']')) {
            const baseName = routeName.split('[')[0];
            if (baseName) {
              routeName = baseName;
            }
          }

          // Avoid duplicates
          if (!routes.includes(routeName)) {
            routes.push(routeName);
          }
        }
      });

      console.log(`🔍 Discovered routes: ${routes.join(', ')}`);

      routes.forEach((route) => {
        const routeDir = path.join(outDir, route);

        // Create route directory if it doesn't exist
        if (!fs.existsSync(routeDir)) {
          fs.mkdirSync(routeDir, { recursive: true });
          console.log(`📁 Created route directory: ${route}/`);
        }

        // Copy index.html to route directory
        const routeIndexPath = path.join(routeDir, 'index.html');
        fs.copyFileSync(indexPath, routeIndexPath);
        console.log(`📄 Copied index.html to ${route}/index.html`);
      });

      console.log('✅ SPA routes created successfully');
    },
  };
}
