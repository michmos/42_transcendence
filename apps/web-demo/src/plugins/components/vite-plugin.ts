// Vite Plugin for Component Transformation
// This runs in Node.js during build time

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import type { ComponentTransformOptions, ComponentInfo } from './types.js';

export function viteComponentTransform(
  options: ComponentTransformOptions = {}
): Plugin {
  const { componentsDir = 'src/components', enableLogging = true } = options;

  return {
    name: 'vite-component-transform',
    enforce: 'pre',
    transformIndexHtml(html: string) {
      // Find all custom component tags in the HTML (both self-closing and with closing tags)
      const componentRegex =
        /<([A-Z][a-zA-Z]*)\s*([^>]*?)(?:\s*\/)?>(.*?)<\/\1>|<([A-Z][a-zA-Z]*)\s*([^>]*?)\s*\/>/gs;
      const components: ComponentInfo[] = [];
      let transformedHtml = html;

      let match;
      while ((match = componentRegex.exec(html)) !== null) {
        const [
          fullMatch,
          componentName1,
          attributes1,
          ,
          componentName2,
          attributes2,
        ] = match;

        // Determine which capture group matched
        const componentName = componentName1 || componentName2;
        const attributes = attributes1 || attributes2 || '';

        // Skip if componentName is undefined
        if (!componentName) continue;

        const componentPath = path.resolve(
          process.cwd(),
          componentsDir,
          componentName
        );
        const htmlPath = path.join(componentPath, 'index.html');
        const tsPath = path.join(componentPath, 'index.ts');

        // Check if component files exist
        if (fs.existsSync(htmlPath) && fs.existsSync(tsPath)) {
          const componentInfo: ComponentInfo = {
            name: componentName,
            path: componentPath,
            htmlPath,
            tsPath,
          };

          components.push(componentInfo);

          // Generate unique container ID for this component instance
          const containerId = generateContainerId(componentName);
          const containerDiv = `<div id="${containerId}" data-component="${componentName}" ${attributes}></div>`;

          transformedHtml = transformedHtml.replace(fullMatch, containerDiv);
        } else {
          if (enableLogging) {
            console.warn(
              `⚠️ Component ${componentName} not found. Expected files:`,
              {
                html: htmlPath,
                ts: tsPath,
              }
            );
          }
        }
      }

      // If we found components, add initialization script
      if (components.length > 0 && enableLogging) {
        console.log(
          `🔧 Vite plugin found ${components.length} components:`,
          components.map((c) => c.name)
        );

        // Add component initialization script
        const initScript = generateInitializationScript();
        transformedHtml += initScript;
      }

      return transformedHtml;
    },
  };
}

// Generate a unique container ID for component instances
function generateContainerId(componentName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${componentName.toLowerCase()}-${timestamp}-${random}`;
}

// Generate the initialization script for components
function generateInitializationScript(): string {
  return `
<script type="module">
// Component system initialization script
// This script ensures components are properly initialized after page load

(function initializeComponentsOnLoad() {
  'use strict';
  
  // Wait for the main application and component system to load
  function waitForComponentSystem() {
    // Check if the component system is available
    if (typeof window !== 'undefined' && document.readyState !== 'loading') {
      // Dispatch a custom event to trigger component initialization
      const event = new CustomEvent('componentSystemRefresh', {
        detail: { source: 'vite-plugin' }
      });
      
      document.dispatchEvent(event);
      
      // Also try direct initialization if component system is already loaded
      setTimeout(() => {
        const refreshEvent = new CustomEvent('componentSystemRefresh', {
          detail: { source: 'vite-plugin-delayed' }
        });
        document.dispatchEvent(refreshEvent);
      }, 100);
    } else {
      // If DOM is still loading, wait for it
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForComponentSystem);
      } else {
        // Retry after a short delay
        setTimeout(waitForComponentSystem, 50);
      }
    }
  }
  
  // Start the initialization process
  waitForComponentSystem();
  
  // Also listen for page navigation in SPAs
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      const event = new CustomEvent('componentSystemRefresh', {
        detail: { source: 'spa-navigation' }
      });
      document.dispatchEvent(event);
    }, 50);
  });
})();
</script>`;
}
