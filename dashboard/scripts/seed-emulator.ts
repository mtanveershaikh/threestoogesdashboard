import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { seedFirestore } from './seed';

const [host, port] = (process.env['FIRESTORE_EMULATOR_HOST'] ?? 'localhost:8080').split(':');

const env = await initializeTestEnvironment({
  projectId: 'demo-tradebots',
  firestore: { host, port: Number(port) },
});
await env.withSecurityRulesDisabled(async (ctx) => seedFirestore(ctx.firestore()));
await env.cleanup();
console.log(`Seeded the Firestore emulator at ${host}:${port} with the sample fixtures.`);
