// Builds the per-row *_HTML variables for Resend templates (trip-pack, trip-departure-tomorrow).
// Resend caps each variable value at 2,000 characters, so every row is its own slot
// (DAY_1_HTML … DAY_8_HTML); unused slots fall back to '' and render nothing.
// Keep markup and slot counts in sync with scripts/emails/templates.mjs.

const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";
const SANS = "Archivo, 'Helvetica Neue', Arial, sans-serif";
const MAX_VALUE_LENGTH = 2000;

export const EMAIL_ROW_SLOTS = { DAY: 8, PACK: 8, CHECK: 6 } as const;
type TSlotPrefix = keyof typeof EMAIL_ROW_SLOTS;

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  );

export type TItineraryDay = { day: string; date: string; text: string };
export type TChecklistItem = { title: string; body: string };

const itineraryRow = (
  { day, date, text }: TItineraryDay,
  i: number,
): string => {
  const top = i === 0 ? '2px dashed #B9C0AE' : '1px solid #E2E5DC';
  return `<tr><td style="width:96px;padding:12px 12px 12px 0;border-top:${top};vertical-align:top;font:600 13px/1.4 ${MONO};letter-spacing:0.04em;color:#1F3A5F">DAY ${escapeHtml(day)}<br><span style="font-weight:500;color:#4B5563">${escapeHtml(date)}</span></td><td style="padding:12px 0;border-top:${top};vertical-align:top;font:400 15px/1.5 ${SANS};color:#1A2230">${escapeHtml(text)}</td></tr>`;
};

const checklistRow = ({ title, body }: TChecklistItem, i: number): string => {
  const top = i === 0 ? 'none' : '1px solid #E2E5DC';
  return `<tr><td style="width:24px;padding:12px 0;border-top:${top};vertical-align:top;font:700 16px/1.4 ${SANS};color:#1C6247">&#10003;</td><td style="padding:12px 0;border-top:${top};vertical-align:top"><p style="margin:0 0 2px;font:600 16px/1.4 ${SANS};color:#1A2230">${escapeHtml(title)}</p><p style="margin:0;font:400 14px/1.5 ${SANS};color:#4B5563">${escapeHtml(body)}</p></td></tr>`;
};

const toSlots = (
  prefix: TSlotPrefix,
  rows: string[],
): Record<string, string> => {
  const max = EMAIL_ROW_SLOTS[prefix];
  if (rows.length > max)
    throw new Error(
      `${prefix}: ${rows.length} rows, template has ${max} slots`,
    );
  return Object.fromEntries(
    rows.map((row, i) => {
      if (row.length > MAX_VALUE_LENGTH)
        throw new Error(
          `${prefix}_${i + 1}_HTML is ${row.length} chars (max ${MAX_VALUE_LENGTH})`,
        );
      return [`${prefix}_${i + 1}_HTML`, row];
    }),
  );
};

/** trip-pack: DAY_n_HTML */
export const itineraryVariables = (days: TItineraryDay[]) =>
  toSlots('DAY', days.map(itineraryRow));

/** trip-pack: PACK_n_HTML */
export const packingVariables = (items: TChecklistItem[]) =>
  toSlots('PACK', items.map(checklistRow));

/** trip-departure-tomorrow: CHECK_n_HTML */
export const checklistVariables = (items: TChecklistItem[]) =>
  toSlots('CHECK', items.map(checklistRow));
