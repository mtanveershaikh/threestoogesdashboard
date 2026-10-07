import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('keeps numbers as numbers, with their sign', () => {
    expect(csvCell(0.21)).toBe('0.21');
    expect(csvCell(-1)).toBe('-1');
    expect(csvCell(0)).toBe('0');
    expect(csvCell(NaN)).toBe('');
  });

  it('writes missing values as empty cells', () => {
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(null)).toBe('');
  });

  it('quotes cells with commas, quotes or line breaks', () => {
    expect(csvCell('55-day high, volume above 1.5x')).toBe('"55-day high, volume above 1.5x"');
    expect(csvCell('say "go"')).toBe('"say ""go"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
  });

  it('stops text from running as a spreadsheet formula', () => {
    expect(csvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(csvCell('+1 later')).toBe("'+1 later");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell('-2R')).toBe("'-2R");
    expect(csvCell('Breakout')).toBe('Breakout');
  });

  it('joins rows with CRLF and starts with a byte-order mark', () => {
    const text = toCsv([['a', 1], [], ['b', -2]]);
    expect(text.startsWith('﻿')).toBe(true);
    expect(text.slice(1)).toBe('a,1\r\n\r\nb,-2\r\n');
  });
});
