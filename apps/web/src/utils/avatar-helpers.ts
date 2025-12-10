/**
 * Converts an avatar path to a URL accessible through the CDN proxy or returns full URLs as-is
 * @param avatarPath - Can be:
 *   - Full URL: "https://cdn.intra.42.fr/..." (returned as-is)
 *   - Relative path: "/userAvatars/xxx.png" (prefixed with /cdn for proxy)
 *   - null/undefined (returns null)
 * @returns URL string or null if avatarPath is null/empty
 */
export function getAvatarSrc(
  avatarPath: string | null | undefined
): string | null {
  if (!avatarPath) {
    return null;
  }

  // If it's already a full URL (http/https), return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // If it already starts with /cdn, return as-is (avoid double-prefixing)
  if (avatarPath.startsWith('/cdn')) {
    return avatarPath;
  }

  // Avatar paths stored in database are relative paths like "/userAvatars/xxx.png"
  // They need to be prefixed with /cdn to route through the Vite dev server proxy
  // which forwards to the CDN server
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;

  // Prepend /cdn to route through the CDN proxy
  return `/cdn${cleanPath}`;
}
