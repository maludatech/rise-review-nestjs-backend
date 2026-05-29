export function normalizeRating(
  platform: string,
  rawRating: number | null | undefined,
): number {
  if (typeof rawRating !== 'number' || Number.isNaN(rawRating)) return 0;

  const p = platform.trim().toLowerCase();
  const round1 = (n: number) => Math.round(n * 10) / 10;

  switch (p) {
    case 'google':
    case 'tripadvisor':
    case 'opentable':
    case 'doctolib':
      return round1(rawRating);

    case 'covermanager':
    case 'thefork':
    case 'lafourchette':
      return round1((rawRating / 10) * 5);

    default:
      console.warn(`Unknown platform: ${platform}`);
      return round1(rawRating);
  }
}
