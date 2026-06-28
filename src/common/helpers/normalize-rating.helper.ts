export function normalizeRating(
  platform: string,
  rawRating: number | null | undefined,
): number {
  if (typeof rawRating !== 'number' || Number.isNaN(rawRating)) return 0;

  const p = platform.trim().toLowerCase();
  const round1 = (n: number) => Math.round(n * 10) / 10;

  switch (p) {
    case 'google':
    case 'opentable':
      return round1(rawRating);

    case 'covermanager':
      // CoverManager uses a 0–10 scale, normalise to 0–5
      return round1((rawRating / 10) * 5);

    default:
      return round1(rawRating);
  }
}
