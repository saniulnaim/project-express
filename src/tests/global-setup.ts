import { execSync } from 'node:child_process';

export default function setup(): void {
  execSync('npx prisma migrate deploy --config prisma7.config.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
