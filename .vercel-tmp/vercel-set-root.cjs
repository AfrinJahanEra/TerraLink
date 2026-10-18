#!/usr/bin/env node
/**
 * Updates the Vercel project's Root Directory setting via the REST API.
 * Usage: node vercel-set-root.cjs <newRootDirectory>
 * The auth token is read from the local Vercel CLI config and NEVER printed.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const newRoot = process.argv[2];
if (!newRoot) {
  console.error('Usage: node vercel-set-root.cjs <newRootDirectory>');
  process.exit(1);
}

const PROJECT_ID = 'prj_b5ef2axJ3ekgJp7OkW6LnWSfYAmS';
const TEAM_ID = 'team_tUWpmoNsnNPDJr1dZ9rIVN2q';
const EXPECTED_NAME = 'teralink-probah';

// Candidate locations of the Vercel CLI auth config (newest layout first)
const AUTH_CANDIDATES = [
  path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json'),
  path.join(process.env.LOCALAPPDATA || '', 'com.vercel.cli', 'auth.json'),
  path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
  path.join(os.homedir(), '.vercel', 'auth.json'),
];

function readToken() {
  for (const p of AUTH_CANDIDATES) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      const token = raw.token || (raw.data && raw.data.token);
      if (token) return token;
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function main() {
  const token = readToken();
  if (!token) {
    console.error('ERROR: Could not find Vercel CLI auth token on this machine.');
    process.exit(1);
  }

  const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Read current project settings
  let res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`GET failed: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const proj = await res.json();
  if (proj.name !== EXPECTED_NAME) {
    console.error(`WARNING: project name is "${proj.name}", expected "${EXPECTED_NAME}"`);
  }
  console.log(JSON.stringify({
    name: proj.name,
    rootDirectory_before: proj.rootDirectory || '(not set)',
    framework: proj.framework || '(default)'
  }));

  // 2. Update the Root Directory setting
  res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ rootDirectory: newRoot })
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`PATCH failed: HTTP ${res.status} ${text}`);
    process.exit(1);
  }
  const updated = JSON.parse(text);
  console.log(JSON.stringify({
    status: 'success',
    name: updated.name,
    rootDirectory_after: updated.rootDirectory || '(not set)'
  }));
}

main().catch((e) => {
  console.error('Unexpected error: ' + e.message);
  process.exit(1);
});
