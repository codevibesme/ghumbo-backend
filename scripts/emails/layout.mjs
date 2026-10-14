// Email-safe building blocks for Ghumbo's Resend templates (Ticket design).
// Tables + inline styles only: no flex, no SVG (Gmail strips it), no external CSS.

export const C = {
  ink: '#1A2230',
  navy: '#1F3A5F',
  red: '#C2362B',
  paper: '#F2F4EC',
  dash: '#B9C0AE',
  muted: '#4B5563',
  rule: '#E2E5DC',
  dark: '#141A24',
  darkRule: '#2A3342',
  darkDash: '#3A4352',
  yellow: '#F4D35E',
  white: '#FFFFFF',
  greenBg: '#DCEFE6',
  greenFg: '#1C6247',
  amberBg: '#FBEBC4',
  amberFg: '#7A5200',
};

const SANS = "Archivo, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

export const v = (key) => `{{{${key}}}}`;

const table = (inner, style = '') =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;${style}">${inner}</table>`;

const row = (inner, pad = '0 0 20px') => `<tr><td style="padding:${pad}">${inner}</td></tr>`;

export const kicker = (text) =>
  row(`<p style="margin:0;font:500 12px/1.2 ${MONO};letter-spacing:0.08em;text-transform:uppercase;color:${C.red}">${text}</p>`);

export const h1 = (text) =>
  row(`<h1 style="margin:0;font:800 34px/1.1 ${SANS};letter-spacing:-0.02em;color:${C.ink}">${text}</h1>`);

export const h2 = (text, pad = '8px 0 8px') =>
  row(`<h2 style="margin:0;font:800 22px/1.2 ${SANS};letter-spacing:-0.01em;color:${C.ink}">${text}</h2>`, pad);

export const p = (text, pad = '0 0 24px') =>
  row(`<p style="margin:0;font:400 16px/1.55 ${SANS};color:${C.ink}">${text}</p>`, pad);

export const note = (text, pad = '0 0 16px') =>
  row(`<p style="margin:0;font:400 14px/1.5 ${SANS};color:${C.muted}">${text}</p>`, pad);

export const button = (href, label, pad = '0 0 16px') =>
  row(
    table(
      `<tr><td bgcolor="${C.navy}" style="background:${C.navy};border-radius:6px;text-align:center"><a href="${href}" style="display:block;padding:16px 24px;font:700 16px/20px ${SANS};color:${C.paper};text-decoration:none">${label}</a></td></tr>`,
      'border-collapse:separate',
    ),
    pad,
  );

export const badge = (text, tone = 'green') => {
  const [bg, fg] = tone === 'amber' ? [C.amberBg, C.amberFg] : tone === 'outline' ? [C.white, C.ink] : [C.greenBg, C.greenFg];
  const border = tone === 'outline' ? `border:1.5px solid ${C.ink};` : '';
  return `<span style="display:inline-block;padding:5px 8px;border-radius:4px;background:${bg};color:${fg};${border}font:600 12px/14px ${MONO};letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap">${text}</span>`;
};

// Label / value rows, first row dashed. rows: [label, value, { mono }]
export const kv = (rows, labelWidth = 132) =>
  table(
    rows
      .map(([label, value, opts = {}], i) => {
        const top = i === 0 ? `2px dashed ${C.dash}` : `1px solid ${C.rule}`;
        const valueFont = opts.mono
          ? `font:600 14px/1.4 ${MONO};letter-spacing:0.02em;text-transform:uppercase`
          : `font:600 15px/1.4 ${SANS}`;
        return `<tr><td style="padding:10px 16px 10px 0;border-top:${top};vertical-align:top;width:${labelWidth}px;font:500 12px/1.65 ${MONO};letter-spacing:0.08em;text-transform:uppercase;color:${C.muted}">${label}</td><td style="padding:10px 0;border-top:${top};vertical-align:top;text-align:right;color:${C.ink};${valueFont}">${value}</td></tr>`;
      })
      .join(''),
  );

// White bordered card
export const card = (inner, pad = '0 0 24px', innerPad = '24px') =>
  row(
    table(`<tr><td style="padding:${innerPad}">${inner}</td></tr>`, `border-collapse:separate;background:${C.white};border:1.5px solid ${C.ink};border-radius:6px`),
    pad,
  );

export const label = (text) =>
  `<p style="margin:0 0 8px;font:500 12px/1.2 ${MONO};letter-spacing:0.08em;text-transform:uppercase;color:${C.muted}">${text}</p>`;

export const bigMono = (text, size = 26) =>
  `<p style="margin:0;font:600 ${size}px/1.15 ${MONO};letter-spacing:0.02em;color:${C.ink}">${text}</p>`;

export const smallP = (text, color = C.muted, margin = '8px 0 0') =>
  `<p style="margin:${margin};font:400 15px/1.5 ${SANS};color:${color}">${text}</p>`;

// Callout with coloured left rule
export const callout = (title, body, color = C.navy, pad = '0 0 24px') =>
  row(
    table(
      `<tr><td style="padding:16px 20px">` +
        `<p style="margin:0 0 4px;font:700 16px/1.4 ${SANS};color:${C.ink}">${title}</p>` +
        `<p style="margin:0;font:400 15px/1.5 ${SANS};color:${C.ink}">${body}</p></td></tr>`,
      `border-collapse:separate;background:${C.white};border:1.5px solid ${C.ink};border-left:4px solid ${color};border-radius:6px`,
    ),
    pad,
  );

// Numbered steps: [ [kicker, title, body], ... ]
export const steps = (items, pad = '0 0 24px') =>
  row(
    table(
      items
        .map(([k, title, body], i) => {
          const top = i === 0 ? 'none' : `2px dashed ${C.dash}`;
          return `<tr><td style="width:44px;padding:16px 0;border-top:${top};vertical-align:top;font:800 22px/1.15 ${SANS};color:${C.navy}">${String(i + 1).padStart(2, '0')}</td><td style="padding:16px 0;border-top:${top};vertical-align:top"><p style="margin:0 0 8px;font:500 12px/1.2 ${MONO};letter-spacing:0.08em;text-transform:uppercase;color:${C.red}">${k}</p><p style="margin:0 0 4px;font:700 16px/1.35 ${SANS};color:${C.ink}">${title}</p><p style="margin:0;font:400 15px/1.5 ${SANS};color:${C.muted}">${body}</p></td></tr>`;
        })
        .join(''),
    ),
    pad,
  );

// Bulleted feature list: [ [title, body], ... ]
export const features = (items, pad = '0 0 32px') =>
  row(
    table(
      items
        .map(([title, body], i) => {
          const top = i === 0 ? 'none' : `1px solid ${C.rule}`;
          return `<tr><td style="width:20px;padding:14px 0;border-top:${top};vertical-align:top;font:800 16px/1.4 ${SANS};color:${C.red}">&#8226;</td><td style="padding:12px 0;border-top:${top};vertical-align:top"><p style="margin:0 0 2px;font:600 16px/1.4 ${SANS};color:${C.ink}">${title}</p><p style="margin:0;font:400 15px/1.5 ${SANS};color:${C.muted}">${body}</p></td></tr>`;
        })
        .join(''),
    ),
    pad,
  );

// 1–5 rating buttons linking to `${base}?score=n`
export const ratingRow = (base) =>
  table(
    `<tr>${[1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td bgcolor="${C.white}" style="background:${C.white};border:1.5px solid ${C.ink};border-radius:6px;text-align:center"><a href="${base}?score=${n}" style="display:block;padding:13px 0;font:600 20px/22px ${MONO};color:${C.navy};text-decoration:none">${n}</a></td></tr></table></td>`,
      )
      .join('')}</tr>`,
    'margin:0 -4px;width:calc(100% + 8px)',
  ) +
  table(
    `<tr><td style="padding-top:10px;font:500 12px/1 ${MONO};letter-spacing:0.04em;color:${C.muted}">1 · NOT FOR ME</td><td style="padding-top:10px;text-align:right;font:500 12px/1 ${MONO};letter-spacing:0.04em;color:${C.muted}">5 · LOVED IT</td></tr>`,
  );

// Full-width photo in a white frame (536px = 600 - 2×32 padding)
export const photo = (src, alt, caption, pad = '0 0 24px') =>
  row(
    table(
      `<tr><td style="padding:8px 8px 0"><img src="${src}" alt="${alt}" width="518" style="display:block;width:100%;max-width:518px;height:auto;border:0;border-radius:4px"></td></tr>` +
        (caption
          ? `<tr><td style="padding:10px 12px 12px;font:500 12px/1.3 ${MONO};letter-spacing:0.08em;text-transform:uppercase;color:${C.ink}">${caption}</td></tr>`
          : '<tr><td style="height:8px;line-height:8px;font-size:0">&#160;</td></tr>'),
      `border-collapse:separate;background:${C.white};border:1.5px solid ${C.ink};border-radius:6px`,
    ),
    pad,
  );

// Trip card with thumbnail left. t: { img, alt, meta, name, url, line, price }
export const tripCard = (t, pad = '0 0 12px') =>
  row(
    table(
      `<tr><td width="140" style="width:140px;padding:8px;vertical-align:top"><a href="${t.url}"><img src="${t.img}" alt="${t.alt}" width="140" height="132" style="display:block;width:140px;height:132px;object-fit:cover;border:0;border-radius:4px"></a></td>` +
        `<td style="padding:12px 16px 12px 8px;vertical-align:top"><p style="margin:0 0 6px;font:500 12px/1.3 ${MONO};letter-spacing:0.06em;text-transform:uppercase;color:${C.muted}">${t.meta}</p>` +
        `<p style="margin:0 0 10px;font:700 17px/1.3 ${SANS};color:${C.ink}"><a href="${t.url}" style="color:${C.ink};text-decoration:none">${t.name}</a></p>` +
        `<p style="margin:0;font:500 13px/1.5 ${MONO};color:${C.ink}">${t.line}<br><span style="font-weight:600">${t.price}</span></p></td></tr>`,
      `border-collapse:separate;background:${C.white};border:1.5px solid ${C.ink};border-radius:6px`,
    ),
    pad,
  );

// Dark "departure board" with up to 3 trips. trips: [{ name, line, badge, price, url }]
export const board = ({ title, linkLabel, linkHref, headLeft, headRight, trips, foot }) => {
  const head = table(
    `<tr><td style="vertical-align:middle"><h2 style="margin:0;font:800 22px/1.1 ${SANS};color:${C.paper}">${title}</h2></td><td style="vertical-align:middle;text-align:right"><a href="${linkHref}" style="font:600 13px/16px ${MONO};letter-spacing:0.06em;text-transform:uppercase;color:${C.yellow};text-decoration:underline">${linkLabel}</a></td></tr>`,
  );
  const rows =
    `<tr><td style="padding:16px 0 10px;font:500 12px/1 ${MONO};letter-spacing:0.08em;color:${C.dash}">${headLeft}</td><td style="padding:16px 0 10px;text-align:right;font:500 12px/1 ${MONO};letter-spacing:0.08em;color:${C.dash}">${headRight}</td></tr>` +
    trips
      .map(
        (t) =>
          `<tr><td colspan="2" style="padding:12px 0 6px;border-top:1px solid ${C.darkRule};font:500 15px/1.35 ${MONO};color:${C.paper}">${t.url ? `<a href="${t.url}" style="color:${C.paper};text-decoration:none">${t.name}</a>` : t.name}</td></tr>` +
          `<tr><td style="padding:0 0 12px;font:500 14px/24px ${MONO};color:${C.yellow}">${t.line}${t.badge ? `&#160;&#160;${t.badge}` : ''}</td><td style="padding:0 0 12px;text-align:right;font:500 15px/24px ${MONO};color:${C.yellow};white-space:nowrap">${t.price}</td></tr>`,
      )
      .join('');
  const footer = foot
    ? `<p style="margin:6px 0 0;padding-top:14px;border-top:1px solid ${C.darkRule};font:500 12px/1.4 ${MONO};letter-spacing:0.04em;color:${C.dash}">${foot}</p>`
    : '';
  return row(
    table(
      `<tr><td bgcolor="${C.dark}" style="padding:22px 24px;background:${C.dark};border-radius:6px">${head}${table(rows)}${footer}</td></tr>`,
      `border-collapse:separate;background:${C.dark};border-radius:6px`,
    ),
    '0',
  );
};

const wordmark = (logoUrl, color) =>
  logoUrl
    ? `<img src="${logoUrl}" width="150" alt="Ghumbo" style="display:block;border:0;width:150px;height:auto">`
    : `<span style="font:800 30px/1 ${SANS};letter-spacing:-1px;color:${color}">ghumbo</span><span style="font:800 30px/1 ${SANS};color:${C.red}">.</span>`;

/**
 * Wraps a body (a string of <tr> rows) in the Ghumbo shell.
 * footer: { reason: string, lines?: string[], unsubscribe?: boolean }
 */
export const layout = ({ title, preheader, body, footer, brand }) => {
  const links = [
    `<a href="https://ghumbo.com/help" style="color:${C.paper};text-decoration:underline">Help</a>`,
    `<a href="https://ghumbo.com/privacy" style="color:${C.paper};text-decoration:underline">Privacy</a>`,
    footer.unsubscribe ? `<a href="${v('UNSUBSCRIBE_LINK')}" style="color:${C.paper};text-decoration:underline">Unsubscribe</a>` : '',
  ]
    .filter(Boolean)
    .join('&#160;&#160;&#160;&#160;');

  const footLines = [
    footer.reason,
    ...(footer.lines ?? []),
    `Replies go to <a href="mailto:support@ghumbo.com" style="color:${C.paper}">support@ghumbo.com</a>.`,
    `Ghumbo · ${brand.address}${footer.gstin ? ` · GSTIN ${brand.gstin}` : ''}`,
  ]
    .map((l) => `<p style="margin:0 0 8px;font:400 14px/1.5 ${SANS};color:${C.paper}">${l}</p>`)
    .join('');

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;padding:0;-webkit-text-size-adjust:100%}
table{border-collapse:collapse}
a{color:${C.navy}}
@media (max-width:620px){.g-wrap{width:100% !important}.g-pad{padding-left:20px !important;padding-right:20px !important}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.paper}" style="background:${C.paper}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" class="g-wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.white};border-collapse:collapse">
<tr><td class="g-pad" bgcolor="${C.paper}" style="padding:24px 32px;background:${C.paper};border-bottom:2px dashed ${C.dash}"><a href="https://ghumbo.com" style="text-decoration:none">${wordmark(brand.logoUrl, C.ink)}</a></td></tr>
<tr><td class="g-pad" style="padding:32px;font-family:${SANS};color:${C.ink}">
${table(body)}
</td></tr>
<tr><td class="g-pad" bgcolor="${C.dark}" style="padding:28px 32px 32px;background:${C.dark}">
<p style="margin:0 0 14px;padding-bottom:14px;border-bottom:2px dashed ${C.darkDash}">${wordmark(brand.logoUrlDark, C.paper)}</p>
${footLines}
<p style="margin:12px 0 0;font:600 13px/1.5 ${MONO};letter-spacing:0.04em">${links}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
};
