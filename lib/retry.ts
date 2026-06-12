// Retry a flaky async op a couple of times with a short backoff. Neon's
// free-tier compute auto-suspends, so the first query after idle can fail with
// a transient "fetch failed" / cold-start timeout; a quick retry recovers it.
export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 600,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}
