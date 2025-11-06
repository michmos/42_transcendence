/**
 * Base icon SVG paths (without size classes) for each emoji.
 * This allows us to apply different sizes as needed.
 */
const iconPaths: Record<string, string> = {
  '🎯': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  '📈': '<path d="m21 7-6-4-6 4-6-4v14l6-4 6 4 6-4z"/>',
  '🏆': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  '📊': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  '👥': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  '🎮': '<path d="M10.82 12.49a.5.5 0 0 0-.76-.43l-1.45.87a.5.5 0 0 1-.51 0l-1.45-.87a.5.5 0 0 0-.76.43v2.51l2.5 1.5 2.5-1.5z"/><path d="m10.5 12.5-1.5.9-1.5-.9"/><path d="M6 12V6.5C6 4 7.5 3 9.5 3H14c1 0 2 .5 2 2v9.5"/><path d="m16.5 5.5-2 2.5 2 2.5"/>',
};

/**
 * Create an SVG icon with the specified size class.
 *
 * @param emoji - The emoji icon key
 * @param sizeClass - The size class (e.g., 'w-5 h-5' or 'w-4 h-4')
 * @returns The SVG string
 */
function createIcon(emoji: string, sizeClass: string): string {
  const path = iconPaths[emoji];
  if (!path) {
    return '';
  }
  return `<svg class="${sizeClass}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/**
 * Icon registry mapping emoji icons to their SVG representations.
 * This ensures consistency across components and reduces duplication.
 * Uses w-5 h-5 as the default size (for StatCard).
 */
export const iconMap: Record<string, string> = {
  '🎯': createIcon('🎯', 'w-5 h-5'),
  '📈': createIcon('📈', 'w-5 h-5'),
  '🏆': createIcon('🏆', 'w-5 h-5'),
  '📊': createIcon('📊', 'w-5 h-5'),
  '👥': createIcon('👥', 'w-5 h-5'),
};

/**
 * Icon registry for QuickActionButton (uses w-4 h-4 size).
 */
export const quickActionIconMap: Record<string, string> = {
  '🎮': createIcon('🎮', 'w-4 h-4'),
  '👥': createIcon('👥', 'w-4 h-4'),
  '🎯': createIcon('🎯', 'w-4 h-4'),
  '📊': createIcon('📊', 'w-4 h-4'),
};

/**
 * Get the SVG icon for a given emoji, or return a fallback span element.
 *
 * @param emoji - The emoji icon key
 * @param fallbackSize - The size class for the fallback span (default: 'text-xl')
 * @returns The SVG string or fallback span element
 */
export function getIcon(emoji: string, fallbackSize: string = 'text-xl'): string {
  return iconMap[emoji] || `<span class="${fallbackSize}">${emoji}</span>`;
}

/**
 * Get the SVG icon for QuickActionButton (uses w-4 h-4 size).
 *
 * @param emoji - The emoji icon key
 * @returns The SVG string or fallback span element
 */
export function getQuickActionIcon(emoji: string): string {
  return quickActionIconMap[emoji] || `<span class="text-lg">${emoji}</span>`;
}

