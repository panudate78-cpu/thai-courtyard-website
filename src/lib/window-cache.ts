import { isServiceWindowOpen } from "./refresh-schedule";

/**
 * Stops stale admin clients from waking the database outside trading hours.
 *
 * The dashboard itself stops polling outside Tue – Sat 12:00 – 21:00, but any
 * client still running an older build — a tablet left on the orders board, a
 * browser tab opened before the last deploy — keeps calling these endpoints
 * every few seconds. Those requests must not reach Postgres: on Neon's free
 * plan a query every 15 seconds keeps the compute awake around the clock and
 * burns the monthly CU-hour allowance.
 *
 * So outside the window the endpoints answer from the last snapshot this
 * server instance produced, and only go back to the database when there is no
 * snapshot or it is more than `STALE_AFTER_MS` old. Inside the window every
 * request is a fresh query, as before.
 *
 * Freshness trade-off: outside trading hours the panel can show orders placed
 * after the snapshot was taken. Nothing is lost — the first request after
 * 12:00 on a trading day is always fresh — and `?fresh=1` forces a live query
 * (the Refresh button on the orders board uses it).
 */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

type Entry = { payload: unknown; at: number };

const globalForCache = globalThis as typeof globalThis & {
  __thaiCourtyardWindowCache?: Map<string, Entry>;
};

const store = (globalForCache.__thaiCourtyardWindowCache ??= new Map<string, Entry>());

export async function loadOutsideWindow<T>(
  key: string,
  load: () => Promise<T>,
  options: { fresh?: boolean } = {},
): Promise<{ payload: T; cached: boolean }> {
  if (!options.fresh && !isServiceWindowOpen()) {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < STALE_AFTER_MS) {
      return { payload: hit.payload as T, cached: true };
    }
  }
  const payload = await load();
  store.set(key, { payload, at: Date.now() });
  return { payload, cached: false };
}
