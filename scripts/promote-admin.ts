/**
 * Promote a logged-in user to SUPER_ADMIN by email.
 * Usage: npm run admin:promote -- your@gmail.com
 */
import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { userService } from '../src/features/users';

loadEnvConfig(resolve(__dirname, '..'));

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('Usage: npm run admin:promote -- your@gmail.com');
    process.exit(1);
  }

  if (!userService.isUsingDatabase()) {
    console.error('DATABASE_URL is required. Add it to .env or .env.local');
    process.exit(1);
  }

  const { prismaUserRepository } = await import('../src/features/users/prisma-user.repository');
  const user = await prismaUserRepository.findByEmail(email);

  if (!user) {
    console.error(`No user found for email: ${email}`);
    console.error('Log in once with Google at http://localhost:3000/login, then retry.');
    process.exit(1);
  }

  if (user.role === 'SUPER_ADMIN') {
    console.log(`Already SUPER_ADMIN: ${user.email} (${user.id})`);
    return;
  }

  const promoted = await userService.promoteToSuperAdmin(user.id);
  console.log(`Promoted to SUPER_ADMIN: ${promoted.email} (${promoted.id})`);
  console.log('Sign out and sign in again, or hard-refresh, so the session picks up the new role.');
}

main().catch((err) => {
  console.error('Promote failed:', err);
  process.exit(1);
});
