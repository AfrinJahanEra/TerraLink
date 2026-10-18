#!/usr/bin/env node
/**
 * Redeploys the linked Vercel project (terralink-probah) to production.
 * Runs from the repository root; the Vercel project's Root Directory is `app`.
 * Usage: node .vercel-tmp/vercel-deploy.cjs
 */
const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

function run(args, opts = {}) {
  return spawnSync('vercel', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
    ...opts
  });
}

const who = run(['whoami']);
const user = (who.stdout || '').trim();
if (who.status !== 0 || !user) {
  console.error('Not logged in to Vercel');
  console.log(JSON.stringify({ status: 'not_logged_in' }));
  process.exit(1);
}
console.error(`Logged in as: ${user}`);

const result = run(['deploy', '--prod', '--yes'], { timeout: 600000 });
const output = (result.stdout || '') + (result.stderr || '');
console.error(output);
if (result.status !== 0) {
  console.log(JSON.stringify({ status: 'failed' }));
  process.exit(1);
}

const aliased = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const production = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const url = (aliased && aliased[1]) || (production && production[1]) || null;
console.log(JSON.stringify({ status: 'success', url }));
