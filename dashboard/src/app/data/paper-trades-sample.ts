import { AnalystVerdict, Bot, ExitReason, Trade } from './models';

/**
 * Fills out the sample trade list so each bot has exactly as many closed trades as its card says, with the
 * same win rate and average R. The hand-written trades from the mockup are kept as they are; this only adds
 * the older ones. Deterministic, and sample data only.
 */

/** Made-up tickers, none real and none already used by the hand-written trades. */
const TICKERS = [
  'NVRA', 'QBLT', 'HRZN', 'PLTN', 'CRSL', 'VNTX', 'OPAL', 'MRDN', 'SKYL', 'TRVO', 'ELDR', 'GLMR', 'ZYNC', 'BRNT',
  'KOVA', 'LUXE', 'DYNA', 'FLXR', 'HELM', 'JASP', 'KRNL', 'LMNA', 'MYRA', 'NOVT', 'ORBX', 'PRSM', 'QUAS', 'RDGE',
  'SYLV', 'TAUR', 'UMBR', 'VSTA', 'WLDN', 'XENO', 'YARD', 'ZEPH', 'ARCO', 'BLZE', 'CINT', 'DOVR',
];

const RISK_PER_TRADE = 0.01;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function exitFor(r: number, targetRR: number): ExitReason {
  if (r >= targetRR - 0.001) return 'TARGET';
  if (r <= -0.999) return 'STOP';
  if (r === 0) return 'BREAKEVEN_STOP';
  return 'TIME_STOP';
}

/**
 * R results for `count` more trades that, together with the trades already written, give exactly
 * `totalWins` winners and a total of `totalR`. Winners are a few full targets plus some small winners;
 * the rest are stops, small losses and one adjusting trade.
 */
export function fitResults(opts: { count: number; winsNeeded: number; sumNeeded: number; targetRR: number }): number[] {
  const { count, winsNeeded, sumNeeded, targetRR } = opts;
  const losers = count - winsNeeded;
  const smallWins = [0.4, 0.7, 0.55, 0.9, 0.3, 0.8, 0.65];
  const smallLoss = -0.3;

  for (let full = winsNeeded; full >= 0; full--) {
    const small = winsNeeded - full;
    for (let stops = losers - 1; stops >= 0; stops--) {
      const others = losers - stops; // small losses; the last one is adjusted to hit the total exactly
      const fixed = full * targetRR + stops * -1 + (others - 1) * smallLoss + smallWins.slice(0, small).reduce((s, v) => s + v, 0);
      const last = round2(sumNeeded - fixed);
      if (others >= 1 && last >= -0.95 && last <= -0.05) {
        return [
          ...Array<number>(full).fill(targetRR),
          ...smallWins.slice(0, small),
          ...Array<number>(stops).fill(-1),
          ...Array<number>(others - 1).fill(smallLoss),
          last,
        ];
      }
    }
  }
  throw new Error(`No sample trade mix fits ${JSON.stringify(opts)}`);
}

const verdict = (seed: number, win: boolean): AnalystVerdict => {
  const score = 52 + ((seed * 7) % 28) + (win ? 4 : 0);
  return { verdict: score < 56 ? 'HOLD' : 'BUY', score };
};

/** A trading day for the nth sample trade of a bot: spread over `days`, oldest first. */
const pick = (days: string[], i: number, n: number) => days[Math.min(days.length - 1, Math.floor((i * days.length) / n))];

export interface PaperSampleInput {
  bot: Bot;
  /** Results of the trades already written by hand for this bot. */
  existing: Trade[];
  /** Trading days (yyyy-mm-dd) the extra trades may close on, oldest first. */
  days: string[];
  tickerOffset: number;
}

export function generatePaperTrades({ bot, existing, days, tickerOffset }: PaperSampleInput): Trade[] {
  const count = bot.tradeCount - existing.length;
  const totalWins = Math.round((bot.winRatePct * bot.tradeCount) / 100);
  const existingWins = existing.filter((t) => t.rMultiple > 0).length;
  const results = fitResults({
    count,
    winsNeeded: totalWins - existingWins,
    sumNeeded: bot.tradeCount * bot.avgR - existing.reduce((s, t) => s + t.rMultiple, 0),
    targetRR: bot.targetRR,
  });

  // Interleave winners and losers through time instead of grouping them.
  const order = results
    .map((r, i) => ({ r, key: ((i * 37 + tickerOffset * 11) % results.length) + i / 1000 }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.r);

  // Dollars: round each trade by its running total, so the bot's dollar result matches its card exactly
  // instead of drifting by a few dollars of rounding.
  const unit = bot.budget * RISK_PER_TRADE;
  const wantTotal = Math.round(bot.tradeCount * bot.avgR * unit);
  const generatedWant = wantTotal - existing.reduce((s, t) => s + t.pnlUsd, 0);
  const generatedExact = order.reduce((s, r) => s + r * unit, 0);
  const scale = generatedExact === 0 ? 0 : generatedWant / generatedExact;
  let cumulative = 0;
  let paid = 0;

  return order.map((r, i) => {
    cumulative += r * unit * scale;
    const pnlUsd = Math.round(cumulative) - paid;
    paid += pnlUsd;
    const symbol = TICKERS[(tickerOffset + i) % TICKERS.length];
    return {
      id: `t-${symbol.toLowerCase()}-${bot.id}`,
      closedAt: pick(days, i, order.length),
      symbol,
      botId: bot.id,
      exitReason: exitFor(r, bot.targetRR),
      rMultiple: r,
      pnlUsd,
      fundamental: verdict(tickerOffset + i, r > 0),
      technical: verdict(tickerOffset + i * 3, r > 0),
    };
  });
}
