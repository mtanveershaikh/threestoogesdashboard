/** Heartbeat older than this, during market hours, means the bots may have stopped. */
export const STALE_AFTER_MS = 10 * 60 * 1000;

/** True on a weekday between 9:30 and 16:00 New York time, when the US market is open. Holidays are not checked. */
export function isMarketHours(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  if (['Sat', 'Sun'].includes(get('weekday'))) return false;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
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
