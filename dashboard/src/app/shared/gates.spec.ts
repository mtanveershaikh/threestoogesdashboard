import { describe, expect, it } from 'vitest';
import { Gate } from '../data/models';
import { MOCK_REPORTS } from '../data/mock-fixtures';
import { gateStatusText, gateVerdict } from './gates';

const gate = (status: Gate['status'], result = '1'): Gate => ({
  id: 'x', name: 'Profit factor', rule: 'at least 1.3', status, result, progressPct: 50, detail: '',
});

describe('gates', () => {
  it('writes the status in words', () => {
    expect(gateStatusText(gate('MET', '+0.21R'))).toBe('Met: +0.21R');
    expect(gateStatusText(gate('PENDING', '20 of 100'))).toBe('Not yet: 20 of 100');
    expect(gateStatusText(gate('FAILED', '1.2'))).toBe('Not met: 1.2');
  });

  it('says not yet when only pending gates remain', () => {
    const v = gateVerdict(MOCK_REPORTS.breakout.gates);
    expect(v.title).toBe('Not yet');
    expect(v.tone).toBe('warn');
    expect(v.message).toContain('closed trades (20 of 100)');
  });

  it('says not ready when any gate failed, and names it', () => {
    const v = gateVerdict(MOCK_REPORTS.reversion.gates);
    expect(v.title).toBe('Not ready');
    expect(v.tone).toBe('loss');
    expect(v.message).toContain('profit factor (0.9)');
    expect(v.message).not.toContain('closed trades');
  });

  it('says ready only when every gate is met, and leaves the decision to the owner', () => {
    const v = gateVerdict([gate('MET'), gate('MET')]);
    expect(v.title).toBe('Ready to decide');
    expect(v.message).toContain('yours');
  });
});
