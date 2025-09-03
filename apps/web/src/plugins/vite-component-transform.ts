import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

interface ComponentInfo {
  name: string;
  path: string;
  htmlPath: string;
  tsPath: string;
}

export function viteComponentTransform(): Plugin {
  return {
    name: 'vite-component-transform',
    enforce: 'pre',
    transformIndexHtml(html: string) {
      // Find all custom component tags in the HTML
      const componentRegex = /<([A-Z][a-zA-Z]*)\s*([^>]*)\s*\/?>/g;
      const components: ComponentInfo[] = [];
      let transformedHtml = html;

      let match;
      while ((match = componentRegex.exec(html)) !== null) {
        const [fullMatch, componentName, attributes] = match;

        // Skip if componentName is undefined
        if (!componentName) continue;

        const componentPath = path.resolve(
          process.cwd(),
          'src/components',
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

          // Replace the custom tag with a div container
          const containerId = `${componentName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const containerDiv = `<div id="${containerId}" data-component="${componentName}" ${attributes}></div>`;

          transformedHtml = transformedHtml.replace(fullMatch, containerDiv);
        } else {
          console.warn(
            `⚠️ Component ${componentName} not found. Expected files:`,
            {
              html: htmlPath,
              ts: tsPath,
            }
          );
        }
      }

      // If we found components, trigger component system refresh
      if (components.length > 0) {
        console.log(
          `🔧 Vite plugin found ${components.length} components:`,
          components.map((c) => c.name)
        );

        // Add a simple script to trigger component initialization after the main app loads
        const triggerScript = `
<script type="module">
// Wait for the component system to be available, then refresh
window.addEventListener('load', () => {
  // Small delay to ensure all scripts are loaded
  setTimeout(() => {
    if (window.Components) {
      console.log('🔄 Triggering component system refresh from Vite plugin');
      window.Components.refresh();
    } else {
      console.log('🔄 Dispatching component system refresh event');
      window.dispatchEvent(new CustomEvent('componentSystemRefresh'));
    }
  }, 100);
});
</script>`;

        // Add the trigger script at the end of the HTML
        transformedHtml += triggerScript;
      }

      return transformedHtml;
    },
  };
}
