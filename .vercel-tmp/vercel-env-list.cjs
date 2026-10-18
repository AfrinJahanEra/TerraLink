#!/usr/bin/env node
/**
 * Lists the Environment Variable NAMES configured on the Vercel project.
 * Never prints values. Usage: node vercel-env-list.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ID = 'prj_b5ef2axJ3ekgJp7OkW6LnWSfYAmS';
const TEAM_ID = 'team_tUWpmoNsnNPDJr1dZ9rIVN2q';

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
    } catch { /* try next */ }
  }
  return null;
}

async function main() {
  const token = readToken();
  if (!token) { console.error('No token found'); process.exit(1); }
  const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { console.error(`GET failed: HTTP ${res.status}`); process.exit(1); }
  const data = await res.json();
  const envs = (data.envs || []).map((e) => ({
    name: e.key,
    targets: (e.target || []).join(','),
    type: e.type
  }));
  console.log(JSON.stringify(envs, null, 2));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
