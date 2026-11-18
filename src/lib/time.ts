/**
 * Returns the "current time" used for expiry logic.
 * When TEST_MODE=1 and a valid `x-test-now-ms` header is present, that value
 * is used; otherwise the real system clock.
 */
export function getNow(headers: Headers): Date {
  if (process.env.TEST_MODE === "1") {
    const raw = headers.get("x-test-now-ms")?.trim();
    if (raw && /^\d{1,16}$/.test(raw)) {
      const date = new Date(Number(raw));
      if (Number.isFinite(date.getTime())) return date;
    }
  }
  return new Date();
}
