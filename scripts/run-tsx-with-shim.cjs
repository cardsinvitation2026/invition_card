const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.join(__dirname, '..');
process.env.NODE_OPTIONS = '--require ./scripts/shim-server-only.cjs';

const args = ['tsx', ...process.argv.slice(2)];
const result = spawnSync('npx', args, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
