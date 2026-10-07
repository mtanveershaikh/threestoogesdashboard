import { describe, expect, it } from 'vitest';
import { BASE } from './environment.base';
import { environment as demo } from './environment.demo';
import { environment as development } from './environment.development';
import { environment as emulator } from './environment.emulator';

// `environment.ts` itself is swapped for the development file when tests run, so the real production file is
// checked in rules-tests/environment.test.ts instead.
const all = { demo, development, emulator };

describe('environments', () => {
  it('points Approve in Telegram at a real bot, not at Telegram home', () => {
    // A Telegram username is 5 to 32 letters, digits or underscores, and a bot name ends in "bot".
    expect(BASE.telegramUrl).toMatch(/^https:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{3,30}[Bb]ot$/);
    expect(BASE.telegramUrl).toBe('https://t.me/thethreestoogesbot');
  });

  it('never carries a bot token, which would let anyone who opens the site control the bot', () => {
    for (const [name, env] of Object.entries(all)) expect(env.telegramUrl, name).not.toMatch(/\d{6,}:[A-Za-z0-9_-]{20,}/);
  });

  it('gives every build the Telegram link and a non-empty allow-list (none may lose a value)', () => {
    for (const [name, env] of Object.entries(all)) {
      expect(env.telegramUrl, name).toBe(BASE.telegramUrl);
      expect(env.allowedEmails.length, name).toBeGreaterThan(0);
      expect(env.allowedEmails, name).toEqual(BASE.allowedEmails);
      expect(env.firebase.projectId, name).toBeTruthy();
    }
  });

  it('only the emulator build reads Firestore among the local builds, and only it uses the local emulators', () => {
    expect(emulator).toMatchObject({ dataSource: 'firestore', useEmulator: true });
    expect(development).toMatchObject({ dataSource: 'mock', useEmulator: false });
    expect(demo).toMatchObject({ dataSource: 'mock', useEmulator: false });
  });

  it('keeps the emulator away from the real project', () => {
    expect(emulator.firebase.projectId).toBe('demo-tradebots');
    expect(BASE.firebase.projectId).toBe('the-three-stooges');
  });
});
