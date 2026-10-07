import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FirestoreDataService } from '../src/app/data/firestore-data.service';
import {
  MOCK_BOTS, MOCK_PLANS, MOCK_POSITIONS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_SETUPS, MOCK_STATUS, MOCK_TRADES,
} from '../src/app/data/mock-fixtures';
import { seedFirestore } from '../scripts/seed';

let env: RulesTestEnvironment;
let service: FirestoreDataService;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tradebots-service',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
  await env.withSecurityRulesDisabled((ctx) => seedFirestore(ctx.firestore()));
  // Read as the owner, with the real rules in force.
  const owner = env.authenticatedContext('owner', { email: 'm.tanveer.shaikh@gmail.com', email_verified: true });
  service = new FirestoreDataService(owner.firestore(), true);
});

afterAll(async () => {
  await env.cleanup();
});

const first = <T>(o: import('rxjs').Observable<T>) => firstValueFrom(o);

describe('FirestoreDataService against the seeded emulator', () => {
  it('reads the same data the mock service serves', async () => {
    expect(await first(service.getSystemStatus())).toEqual(MOCK_STATUS);
    expect(await first(service.getBots())).toEqual(MOCK_BOTS);
    expect(await first(service.getBot('pullback'))).toEqual(MOCK_BOTS[1]);
    expect(await first(service.getBot('breakout'))).toBeDefined();
    expect(await first(service.getRollups(40))).toEqual(MOCK_ROLLUPS);
    expect(await first(service.getBotReport('reversion'))).toEqual(MOCK_REPORTS.reversion);
  });

  it('limits and orders rollups, plans, positions, trades and setups', async () => {
    const rollups = await first(service.getRollups(5));
    expect(rollups.map((r) => r.date)).toEqual(MOCK_ROLLUPS.slice(-5).map((r) => r.date));

    const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
    expect(sortById(await first(service.getPlans()))).toEqual(sortById(MOCK_PLANS));
    expect(sortById(await first(service.getOpenPositions()))).toEqual(sortById(MOCK_POSITIONS));
    expect(sortById(await first(service.getSetupStats('breakout')))).toEqual(sortById(MOCK_SETUPS.filter((s) => s.botId === 'breakout')));

    const recent = await first(service.getRecentTrades(6));
    expect(recent).toHaveLength(6);
    expect(recent.map((t) => t.closedAt)).toEqual([...recent.map((t) => t.closedAt)].sort().reverse());
    const breakout = await first(service.getRecentTrades(10, 'breakout'));
    expect(breakout.every((t) => t.botId === 'breakout')).toBe(true);
    expect(breakout).toHaveLength(MOCK_TRADES.filter((t) => t.botId === 'breakout').length);
  });

  it('reads every rollup for All time and every bot report', async () => {
    expect(await first(service.getRollups('all'))).toEqual(MOCK_ROLLUPS);
    const reports = await first(service.getBotReports());
    expect(reports.map((r) => r.botId).sort()).toEqual(['breakout', 'pullback', 'reversion']);
    expect(reports.find((r) => r.botId === 'breakout')).toEqual(MOCK_REPORTS.breakout);
  });

  it('returns undefined for an unknown bot', async () => {
    expect(await first(service.getBot('nope' as never))).toBeUndefined();
  });

  it('cannot read when signed out, so a signed-out visit shows nothing', async () => {
    const anon = new FirestoreDataService(env.unauthenticatedContext().firestore());
    await expect(first(anon.getBots())).rejects.toThrow();
  });
});
