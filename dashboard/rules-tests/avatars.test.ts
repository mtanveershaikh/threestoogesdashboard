import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOCK_BOTS } from '../src/app/data/mock-fixtures';

describe('bot avatars', () => {
  it('every bot avatarUrl points at a picture that exists in public/', () => {
    for (const bot of MOCK_BOTS) {
      expect(bot.avatarUrl, bot.id).toBeTruthy();
      expect(existsSync(resolve(__dirname, '../public', bot.avatarUrl!)), bot.avatarUrl).toBe(true);
    }
  });
});
