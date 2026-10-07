import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { environment } from '../src/environments/environment';

describe('production environment', () => {
  it('reads the real database, not the emulator, and not sample data', () => {
    expect(environment.dataSource).toBe('firestore');
    expect(environment.useEmulator).toBe(false);
    expect(environment.firebase.projectId).toBe('the-three-stooges');
  });

  it('has a complete Firebase web config', () => {
    for (const key of ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'] as const) {
      expect(environment.firebase[key], key).toBeTruthy();
    }
  });

  it('points Approve in Telegram at the bot', () => {
    expect(environment.telegramUrl).toBe('https://t.me/thethreestoogesbot');
  });

  it('lists the same accounts as the Firestore rules, so the app and the database never disagree about who may read', () => {
    const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');
    const inRules = [...(rules.match(/token\.email(?:\.lower\(\))? in \[([^\]]*)\]/)?.[1].matchAll(/'([^']+)'/g) ?? [])].map((m) => m[1].toLowerCase());
    const inApp = environment.allowedEmails.map((e) => e.toLowerCase());
    expect([...inApp].sort()).toEqual([...inRules].sort());
    expect(inApp.length).toBeGreaterThan(0);
  });
});
