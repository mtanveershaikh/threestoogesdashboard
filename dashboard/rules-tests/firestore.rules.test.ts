import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const OWNER_EMAIL = 'm.tanveer.shaikh@gmail.com';
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tradebots-rules',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'system/status'), { equity: 5127 });
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe('firestore rules', () => {
  it('denies reads when signed out', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'system/status')));
  });

  it('denies reads for another account', async () => {
    const db = env.authenticatedContext('other', { email: 'someone.else@gmail.com', email_verified: true }).firestore();
    await assertFails(getDoc(doc(db, 'system/status')));
  });

  it('denies reads when the owner email is not verified', async () => {
    const db = env.authenticatedContext('owner', { email: OWNER_EMAIL, email_verified: false }).firestore();
    await assertFails(getDoc(doc(db, 'system/status')));
  });

  it('allows the owner to read', async () => {
    const db = env.authenticatedContext('owner', { email: OWNER_EMAIL, email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, 'system/status')));
  });

  it('denies every write, including from the owner', async () => {
    const db = env.authenticatedContext('owner', { email: OWNER_EMAIL, email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'system/status'), { equity: 1 }));
    await assertFails(updateDoc(doc(db, 'system/status'), { equity: 1 }));
    await assertFails(setDoc(doc(db, 'trades/new'), { symbol: 'X' }));
    await assertFails(deleteDoc(doc(db, 'system/status')));
  });
});
