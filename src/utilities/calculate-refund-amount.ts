export const calculateRefundAmount = (
  cancelledAt: Date,
  departureStartDate: Date,
  amount: number,
) => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const diffDays =
    (departureStartDate.getTime() - cancelledAt.getTime()) / DAY_MS;

  if (diffDays < 7) {
    return 0;
  }

  if (diffDays <= 14) {
    return Math.floor((amount * 25) / 100);
  }

  if (diffDays <= 29) {
    return Math.floor(amount / 2);
  }

  return Math.floor((amount * 90) / 100);
};
