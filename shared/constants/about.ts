export const DATE_PRECISIONS = ['YEAR', 'MONTH', 'DAY'] as const;

export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  YEAR: 'Year',
  MONTH: 'Month',
  DAY: 'Day',
};
