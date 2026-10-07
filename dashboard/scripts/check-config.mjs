// Fails when the production Firebase web config is still empty, so an unusable build never gets deployed.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/environments/environment.base.ts', import.meta.url), 'utf8');
const missing = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'].filter(
  (key) => !new RegExp(`${key}:\\s*'[^']+'`).test(src),
);

if (missing.length) {
  console.error(`Firebase web config is incomplete in src/environments/environment.base.ts. Missing: ${missing.join(', ')}.`);
  process.exit(1);
}
console.log('Firebase web config is filled in.');
