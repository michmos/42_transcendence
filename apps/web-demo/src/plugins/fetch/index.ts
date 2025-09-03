// import { type User } from 'db';

interface User {
  uuid: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  email: string;
  avatar?: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  role: 'ADMIN' | 'MEMBER';
}

async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    console.log('Users:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function generateUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      }),
    });
    const data = await response.json();
    console.log('User created:', data);
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

async function deleteUser(uuid: string): Promise<boolean> {
  try {
    const response = await fetch('/api/user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid }),
    });
    const data = await response.json();
    console.log('User deleted:', data);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export { getUsers, generateUser, deleteUser };

// Export User type for other modules
export type { User };
