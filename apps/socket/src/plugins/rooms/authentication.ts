/**
 * authenticate token
 * @token: jwt token
 * @hostname: hostname
 *
 * @return: uuid of user
 * @throw on invalid token provided
 */
export async function authenticateWithToken(
  token: string,
  hostname: string
): Promise<string> {
  const data = await fetch(`http://${hostname}/api/auth/session`, {
    method: 'GET',
    headers: {
      Cookie: `session=${token}`,
      credentials: 'include',
    },
  });
  const user = await data.json();
  if (!user || !user.uuid) {
    throw new Error('Authentication failed: No user data received');
  }
  return user.uuid;
}
