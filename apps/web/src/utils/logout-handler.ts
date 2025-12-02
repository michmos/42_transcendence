export function handleLogout(): void {
  fetch('/api/auth/logout', {
    method: 'GET',
    credentials: 'include',
  })
    .then(() => {
      window.location.href = '/login';
    })
    .catch((error) => {
      console.error('Logout failed:', error);
    });
}
