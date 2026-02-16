export type DateRange = '24h' | '7d' | '30d' | '90d';

export function dateRangeToDaysBack(range: DateRange): number {
  switch (range) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
  }
}
