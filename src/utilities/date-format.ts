const TIME_ZONE = 'Asia/Kolkata';

const parts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const pick = (date: Date) =>
  Object.fromEntries(
    parts.formatToParts(date).map(({ type, value }) => [type, value]),
  ) as Record<Intl.DateTimeFormatPartTypes, string>;

/** 14:26 IST */
export const formatTimeIST = (date: Date): string => {
  const p = pick(date);
  return `${p.hour}:${p.minute} IST`;
};

/** WED 14 OCT · 14:16 IST */
export const formatDateTimeIST = (date: Date): string => {
  const p = pick(date);
  return `${p.weekday} ${p.day} ${p.month} · ${formatTimeIST(date)}`.toUpperCase();
};
