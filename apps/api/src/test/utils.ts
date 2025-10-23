export const normalUser = {
  uuid: '',
  email: 'normalMail@mail.com',
  username: 'normalUserName',
  role: 'MEMBER',
};

export const adminUser = {
  uuid: '',
  email: 'adminEmail@mail.com',
  username: 'adminUserName',
  role: 'ADMIN',
};

export let testUser = normalUser;

export function setUserTo(userRole: 'ADMIN' | 'MEMBER') {
  if (userRole === 'ADMIN') {
    testUser = adminUser;
  } else {
    testUser = normalUser;
  }
}
