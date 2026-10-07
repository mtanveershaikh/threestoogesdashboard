import { Gate, GateStatus } from '../data/models';

export const GATE_COLORS: Record<GateStatus, string> = {
  MET: 'var(--gain)',
  PENDING: 'var(--warn)',
  FAILED: 'var(--loss)',
};

/** Status in words, so the state never rests on color alone: "Met: +0.21R", "Not yet: 20 of 100", "Not met: 1.2". */
export function gateStatusText(g: Gate): string {
  const word = g.status === 'MET' ? 'Met' : g.status === 'PENDING' ? 'Not yet' : 'Not met';
  return `${word}: ${g.result}`;
}

export interface GateVerdict {
  title: string;
  message: string;
  tone: 'gain' | 'warn' | 'loss';
}

/** The box under the checklist. The go or no-go decision itself is always the owner's. */
export function gateVerdict(gates: Gate[]): GateVerdict {
  const label = (g: Gate) => `${g.name.toLowerCase()} (${g.result})`;
  const failed = gates.filter((g) => g.status === 'FAILED');
  const pending = gates.filter((g) => g.status === 'PENDING');

  if (failed.length) {
    return {
      title: 'Not ready',
      message: `Not met: ${failed.map(label).join(', ')}. Keep paper trading and review this bot before deciding.`,
      tone: 'loss',
    };
  }
  if (pending.length) {
    return {
      title: 'Not yet',
      message: `Every rule that can be checked is met. Still waiting on ${pending.map(label).join(', ')}. Keep paper trading, then decide go or no-go.`,
      tone: 'warn',
    };
  }
  return { title: 'Ready to decide', message: 'Every rule is met. The go or no-go decision is yours.', tone: 'gain' };
}
