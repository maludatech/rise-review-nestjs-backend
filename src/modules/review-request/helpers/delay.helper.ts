export function getVisitDelayMs(reviewTiming?: string): number {
  switch (reviewTiming) {
    case 'immediately':
      return 0;

    case '2hours':
      return 2 * 60 * 60 * 1000;

    case '1day':
      return 24 * 60 * 60 * 1000;

    case '3days':
      return 3 * 24 * 60 * 60 * 1000;

    case '7days':
      return 7 * 24 * 60 * 60 * 1000;

    default:
      return 2 * 60 * 60 * 1000;
  }
}
