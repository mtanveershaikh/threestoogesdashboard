import { describe, expect, it } from 'vitest';
import { MOCK_CONFIG, MOCK_REPORTS, MOCK_STATUS } from '../../data/mock-fixtures';
import { SystemConfig } from '../../data/models';
import {
  budgetNotice, gateLines, humanizeKey, isSensitiveKey, limitLines, paramValue, strategyStatusLabel, universeLabel,
} from './settings-view';

describe('settings view helpers', () => {
  it('writes setting names in words', () => {
    expect(humanizeKey('high_lookback')).toBe('High lookback');
    expect(humanizeKey('stop-atr')).toBe('Stop atr');
  });

  it('hides anything that looks like a secret, even if it is in the document by mistake', () => {
    for (const key of ['api_key', 'apiKey', 'broker_secret', 'accessToken', 'password', 'private_key', 'credentials']) {
      expect(isSensitiveKey(key), key).toBe(true);
      expect(paramValue(key, 'abc123')).toBe('Hidden');
    }
    expect(isSensitiveKey('high_lookback')).toBe(false);
    expect(paramValue('stop_atr', 1.5)).toBe('1.5');
    expect(paramValue('trailing', true)).toBe('Yes');
    expect(paramValue('trailing', false)).toBe('No');
  });

  it('names universes and statuses in words', () => {
    expect(universeLabel('nasdaq100')).toBe('Nasdaq 100');
    expect(universeLabel('nyse_top300')).toBe('NYSE top 300');
    expect(universeLabel('both')).toBe('Nasdaq 100 and NYSE top 300');
    expect(universeLabel('small_caps')).toBe('Small caps');
    expect(strategyStatusLabel('backtest_only')).toBe('Backtest only');
    expect(strategyStatusLabel('paper')).toBe('Paper trading');
  });

  it('shows only the limits that are present', () => {
    const only: SystemConfig = { strategies: [], limits: { tradeCapPerDay: 10 } };
    expect(limitLines(only)).toEqual([{ label: 'Trades per day', value: 'at most 10' }]);
    expect(limitLines({ strategies: [] })).toEqual([]);
  });

  it('words the limits from the sample config', () => {
    const lines = Object.fromEntries(limitLines(MOCK_CONFIG).map((l) => [l.label, l.value]));
    expect(lines['Starting capital']).toBe('$5,000');
    expect(lines['Open risk limit']).toBe('4% of capital');
    expect(lines['Kill switch']).toBe('trips at a drawdown of -10%');
    expect(lines['Cost and slippage']).toBe('0.03R per trade');
  });

  it('the limits agree with the live status the Overview shows', () => {
    expect(MOCK_CONFIG.limits?.openRiskLimitPct).toBe(MOCK_STATUS.openRiskLimitPct);
    expect(MOCK_CONFIG.limits?.tradeCapPerDay).toBe(MOCK_STATUS.tradeCap);
    expect(MOCK_CONFIG.limits?.killSwitchDrawdownPct).toBe(MOCK_STATUS.killSwitch.limitPct);
    expect(MOCK_CONFIG.startingCapital).toBe(MOCK_STATUS.startingCapital);
  });

  it('words the go-live thresholds exactly as each bot report checklist does', () => {
    const fromConfig = gateLines(MOCK_CONFIG);
    for (const bot of ['breakout', 'pullback', 'reversion'] as const) {
      const fromReport = MOCK_REPORTS[bot].gates.map((g) => ({ label: g.name, rule: g.rule }));
      expect(fromReport).toEqual(fromConfig);
    }
  });

  it('warns when the budgets do not add up to the starting capital', () => {
    expect(budgetNotice(MOCK_CONFIG)).toBeUndefined();
    const off: SystemConfig = { ...MOCK_CONFIG, startingCapital: 4000 };
    expect(budgetNotice(off)).toBe("The bot budgets add up to $5,000, but starting capital is $4,000. Check the bots' config.");
    expect(budgetNotice({ strategies: [] })).toBeUndefined();
  });

  it('has a strategy for every bot, with each budget and time stop matching its bot', () => {
    expect(MOCK_CONFIG.strategies.map((s) => s.botId)).toEqual(['breakout', 'pullback', 'reversion']);
    expect(MOCK_CONFIG.strategies.map((s) => s.id)).toEqual(['breakout_v1', 'pullback_v1', 'meanrev_v1']);
  });
});

describe('updatedLabel', () => {
  it('writes the time in UTC', async () => {
    const { updatedLabel } = await import('./settings-view');
    expect(updatedLabel('2026-10-07T12:00:00Z')).toBe('Oct 7, 12:00 UTC');
  });
});
