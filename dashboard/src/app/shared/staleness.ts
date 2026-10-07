/** Heartbeat older than this, during market hours, means the bots may have stopped. */
export const STALE_AFTER_MS = 10 * 60 * 1000;

/**
 * NYSE full-day closures, as New York dates. Source: the NYSE holiday calendar for 2026 and 2027.
 * Beyond the last year listed, only weekends are treated as closed, so extend this list each year.
 */
export const MARKET_HOLIDAYS: ReadonlySet<string> = new Set([
  // 2026
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31',
  '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
]);

/** Days the market closes at 13:00 New York time. */
export const MARKET_EARLY_CLOSES: ReadonlySet<string> = new Set(['2026-11-27', '2026-12-24']);

/** True on a trading day between 9:30 and the close (16:00, or 13:00 on early-close days), New York time. */
export function isMarketHours(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  if (['Sat', 'Sun'].includes(get('weekday'))) return false;
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  if (MARKET_HOLIDAYS.has(date)) return false;
  const closeMinutes = MARKET_EARLY_CLOSES.has(date) ? 13 * 60 : 16 * 60;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return minutes >= 9 * 60 + 30 && minutes < closeMinutes;
}

export function isStale(lastHeartbeat: string, now: Date): boolean {
  const age = now.getTime() - new Date(lastHeartbeat).getTime();
  return isMarketHours(now) && age > STALE_AFTER_MS;
}

/** "25 minutes ago", "2 hours ago". */
export function ageText(lastHeartbeat: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(lastHeartbeat).getTime()) / 60000));
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago` : `${Math.round(hours / 24)} days ago`;
}
