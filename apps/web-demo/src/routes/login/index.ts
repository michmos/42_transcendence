import auth from 'fastify-oauth/client';
export default async function initRoute() {
  console.log('🔐 Login route initializing...');

  await auth();
}
