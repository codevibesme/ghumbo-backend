// Ghumbo Resend templates, ported from the "Ghumbo · Ticket" canvas (journey emails 1–11).
// Each variable: { sample, fallback? }. No fallback = required at send time.
// *_n_HTML variables each take one pre-built <tr> row; src/utilities/email-blocks.ts builds and escapes them.

import {
  C, v, kicker, h1, h2, p, note, button, badge, kv, card, label, bigMono, smallP,
  callout, steps, features, ratingRow, board, photo, tripCard,
} from './layout.mjs';

const REPLY_TO = 'support@ghumbo.com';
export const SENDERS = {
  security: 'Ghumbo <security@mail.ghumbo.com>',
  trips: 'Ghumbo <trips@mail.ghumbo.com>',
  billing: 'Ghumbo Billing <billing@mail.ghumbo.com>',
  hello: 'Ghumbo <hello@updates.ghumbo.com>',
};

// ---- helpers used for previews (production rows come from src/utilities/email-blocks.ts)
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";
const SANS = "Archivo, 'Helvetica Neue', Arial, sans-serif";
export const sampleRows = {
  itinerary: (days) =>
    days
      .map(([day, date, text], i) => {
        const top = i === 0 ? `2px dashed ${C.dash}` : `1px solid ${C.rule}`;
        return `<tr><td style="width:96px;padding:12px 12px 12px 0;border-top:${top};vertical-align:top;font:600 13px/1.4 ${MONO};letter-spacing:0.04em;color:${C.navy}">DAY ${day}<br><span style="font-weight:500;color:${C.muted}">${date}</span></td><td style="padding:12px 0;border-top:${top};vertical-align:top;font:400 15px/1.5 ${SANS};color:${C.ink}">${text}</td></tr>`;
      }),
  checklist: (items) =>
    items
      .map(([title, body], i) => {
        const top = i === 0 ? 'none' : `1px solid ${C.rule}`;
        return `<tr><td style="width:24px;padding:12px 0;border-top:${top};vertical-align:top;font:700 16px/1.4 ${SANS};color:${C.greenFg}">&#10003;</td><td style="padding:12px 0;border-top:${top};vertical-align:top"><p style="margin:0 0 2px;font:600 16px/1.4 ${SANS};color:${C.ink}">${title}</p><p style="margin:0;font:400 14px/1.5 ${SANS};color:${C.muted}">${body}</p></td></tr>`;
      }),
};

// One variable per row (Resend caps a value at 2,000 chars). Must match EMAIL_ROW_SLOTS in src/utilities/email-blocks.ts.
const ROW_SLOTS = { DAY: 8, PACK: 8, CHECK: 6 };
const rowVars = (prefix, sampleRowList) =>
  Object.fromEntries(
    Array.from({ length: ROW_SLOTS[prefix] }, (_, i) => [`${prefix}_${i + 1}_HTML`, { sample: sampleRowList[i] ?? '', fallback: '' }]),
  );
const rowSlots = (prefix, pad) =>
  `<tr><td style="padding:0 0 ${pad}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">${Array.from({ length: ROW_SLOTS[prefix] }, (_, i) => v(`${prefix}_${i + 1}_HTML`)).join('')}</table></td></tr>`;

const tripSlots = (prefix, n, sample) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => i + 1).flatMap((i) =>
      Object.entries(sample(i)).map(([k, s]) => [`${prefix}_${i}_${k}`, { sample: s }]),
    ),
  );

const SAMPLE_TRIPS = [
  { NAME: 'Darjeeling, Kalimpong &amp; Mirik Hill Circuit', DATE: 'SAT 07 NOV · 6D / 5N', SEATS: '11 open', PRICE: '₹12,999' },
  { NAME: 'Darjeeling: Queen of the Hills', DATE: 'FRI 13 NOV · 4D / 3N', SEATS: '14 open', PRICE: '₹7,799' },
  { NAME: 'Kolkata: City of Joy Heritage Trail', DATE: 'SAT 14 NOV · 3D / 2N', SEATS: '03 left', PRICE: '₹5,499' },
];
const NEXT_TRIPS = [
  { NAME: 'Sundarbans: Mangrove &amp; Tiger Safari', META: '3D / 2N · Kolkata', DATE: 'SAT 16 JAN', PRICE: '₹6,599', URL: 'https://ghumbo.com/sundarbans', IMAGE_URL: 'https://placehold.co/280x264/1F3A5F/F2F4EC/png?text=Sundarbans', IMAGE_ALT: 'Royal Bengal tiger in the Sundarbans' },
  { NAME: 'Dooars Wildlife: Gorumara &amp; Jaldapara', META: '4D / 3N · NJP / Bagdogra', DATE: 'FRI 22 JAN', PRICE: '₹11,499', URL: 'https://ghumbo.com/dooars', IMAGE_URL: 'https://placehold.co/280x264/1F3A5F/F2F4EC/png?text=Dooars', IMAGE_ALT: 'Elephant safari in Jaldapara, Dooars' },
  { NAME: 'Sandakphu: Singalila Ridge Trek', META: '6D / 5N · NJP / Bagdogra', DATE: 'FRI 12 MAR', PRICE: '₹12,999', URL: 'https://ghumbo.com/sandakphu', IMAGE_URL: 'https://placehold.co/280x264/1F3A5F/F2F4EC/png?text=Sandakphu', IMAGE_ALT: 'Kanchenjunga from Sandakphu' },
];

const user = { USER_NAME: { sample: 'Riya', fallback: 'there' } };
const unsub = { UNSUBSCRIBE_LINK: { sample: 'https://ghumbo.com/unsubscribe?t=sample' } };

export const templates = [
  // 10 · Sign-in code
  {
    alias: 'auth-sign-in-code',
    name: 'Auth · Sign-in code (OTP)',
    from: SENDERS.security,
    subject: `${v('CODE')} is your Ghumbo sign-in code`,
    preheader: 'It expires in 10 minutes. Never share it with anyone.',
    variables: {
      CODE: { sample: '482 913' },
      EXPIRES_AT: { sample: '14:26 IST' },
      REQUESTED_AT: { sample: 'WED 14 OCT · 14:16 IST' },
      DEVICE: { sample: 'Chrome on Android', fallback: 'Unknown device' },
      LOCATION: { sample: 'Kolkata, West Bengal (approx.)', fallback: 'Unknown' },
      ACCOUNT_EMAIL: { sample: 'riya.sen@example.com' },
    },
    footer: {
      reason: `You're getting this because someone asked to sign in to Ghumbo with ${v('ACCOUNT_EMAIL')}.`,
      lines: ["Security emails can't be turned off."],
    },
    body: () =>
      kicker('Sign-in code') +
      h1('Here’s your code') +
      p('Type this on the Ghumbo sign-in screen. It works once and expires in 10 minutes.') +
      card(
        `<div style="text-align:center">${label('Your 6-digit code')}<p style="margin:4px 0 16px;font:600 44px/1 ${MONO};letter-spacing:0.18em;color:${C.ink}">${v('CODE')}</p><p style="margin:0;padding-top:12px;border-top:2px dashed ${C.dash};font:500 12px/1.4 ${MONO};letter-spacing:0.04em;text-transform:uppercase;color:${C.muted}">Expires ${v('EXPIRES_AT')} · single use</p></div>`,
      ) +
      `<tr><td style="padding:0 0 24px">${kv([
        ['Requested', v('REQUESTED_AT'), { mono: true }],
        ['Device', v('DEVICE')],
        ['Near', v('LOCATION')],
      ])}</td></tr>` +
      callout(
        'Didn’t ask for this?',
        'Ignore this email. Nobody can get into your account without the code. Ghumbo will never call or message you asking for it.',
        C.red,
        '0',
      ),
  },

  // 1 · Welcome
  {
    alias: 'lifecycle-welcome',
    name: 'Lifecycle · 1 Welcome',
    from: SENDERS.hello,
    subject: `Welcome aboard, ${v('USER_NAME')}`,
    preheader: 'Your Ghumbo account is ready. No password to remember.',
    variables: {
      ...user,
      ACCOUNT_EMAIL: { sample: 'riya.sen@example.com' },
      ...tripSlots('TRIP', 3, (i) => SAMPLE_TRIPS[i - 1]),
      ...unsub,
    },
    footer: { reason: "You're getting this because you created a Ghumbo account.", unsubscribe: true },
    body: () =>
      kicker('Account created') +
      h1(`Welcome aboard, ${v('USER_NAME')}`) +
      p('Your Ghumbo account is ready. There’s no password to remember: each time you sign in, we email a 6-digit code to this address, or text one to your mobile.', '0 0 20px') +
      `<tr><td style="padding:0 0 24px">${kv([
        ['Account', v('ACCOUNT_EMAIL')],
        ['Email', badge('Verified')],
      ])}</td></tr>` +
      button('https://ghumbo.com/my-trips', 'Go to My trips →') +
      note('Didn’t create this account? Reply to this email and we’ll close it.', '0 0 40px') +
      h2('What your account does') +
      features([
        ['Track every request', 'See when we got it, when we called and when your seat is confirmed, all in My trips.'],
        ['Save trips for later', 'Keep a departure on your list now and decide after payday.'],
        ['Skip the retyping', 'Your name, email and mobile fill in on your next request.'],
      ]) +
      board({
        title: 'Leaving soon',
        linkLabel: 'All trips →',
        linkHref: 'https://ghumbo.com/trips',
        headLeft: 'TRIP · DEPARTURE',
        headRight: 'FARE · PER PERSON',
        trips: [1, 2, 3].map((i) => ({
          name: v(`TRIP_${i}_NAME`),
          line: v(`TRIP_${i}_DATE`),
          badge: badge(v(`TRIP_${i}_SEATS`)),
          price: v(`TRIP_${i}_PRICE`),
        })),
        foot: 'TWIN SHARING · GST INCLUDED',
      }),
  },

  // 2 · Request received
  {
    alias: 'trip-request-received',
    name: 'Trips · 2 Request received',
    from: SENDERS.trips,
    subject: `We got your request · ${v('BOOKING_REF')}`,
    preheader: `${v('TRIP_SHORT')}, ${v('DEPARTURE_DATE')}, ${v('TRAVELLERS')}. No payment yet.`,
    variables: {
      ...user,
      BOOKING_REF: { sample: 'GH-26DEC-4821' },
      TRIP_NAME: { sample: 'Darjeeling: Queen of the Hills' },
      TRIP_SHORT: { sample: 'Darjeeling' },
      DEPARTURE_DATE: { sample: 'Sat 26 Dec' },
      DEPARTURE_DATES: { sample: 'SAT 26 DEC → TUE 29 DEC 2026' },
      TRAVELLERS: { sample: '2 adults · one room' },
      ESTIMATE: { sample: '≈ ₹18,998 · GST included' },
      SUPPORT_PHONE: { sample: '+91 33 4000 0000' },
      DEPOSIT_AMOUNT: { sample: '₹5,000' },
      TRACK_URL: { sample: 'https://ghumbo.com/my-trips/GH-26DEC-4821' },
    },
    footer: {
      reason: "You're getting this because you requested a seat on a Ghumbo trip.",
      lines: ["Trip updates can't be turned off while a request is open."],
    },
    body: () =>
      kicker('Seat request') +
      h1('We got your request') +
      p(`Thanks, ${v('USER_NAME')}. Your request for ${v('TRIP_NAME')} is in. We call you within 24 hours from ${v('SUPPORT_PHONE')} to sort the rest.`) +
      card(
        label('Your reference') +
          bigMono(v('BOOKING_REF')) +
          smallP('Quote it if you call or write to us.', C.muted, '8px 0 20px') +
          kv([
            ['Trip', v('TRIP_NAME')],
            ['Departure', v('DEPARTURE_DATES'), { mono: true }],
            ['Travellers', v('TRAVELLERS'), { mono: true }],
            ['Estimate', v('ESTIMATE'), { mono: true }],
          ]),
        '0 0 20px',
      ) +
      callout('No payment yet', 'Nothing is charged online. The final amount is confirmed on the call.', C.navy, '0 0 32px') +
      h2('What happens next') +
      steps([
        ['Within 24 hours', 'We call you', `From ${v('SUPPORT_PHONE')}. Save the number so you know it’s us.`],
        ['On the call', 'We confirm your seat', `We answer your questions and hold your seat. A ${v('DEPOSIT_AMOUNT')} deposit confirms it.`],
        ['7 days before', 'Your trip pack arrives', 'Pickup time, your coordinator and a packing list.'],
      ]) +
      button(v('TRACK_URL'), 'Track your request →') +
      note('Need to change something? Reply to this email and quote your reference.', '0'),
  },

  // 3 · We tried calling
  {
    alias: 'trip-missed-call',
    name: 'Trips · 3 We tried calling',
    from: SENDERS.trips,
    subject: `We tried calling you, ${v('USER_NAME')}`,
    preheader: `Pick a callback time so we can hold your ${v('TRIP_SHORT')} seat.`,
    variables: {
      ...user,
      TRIP_SHORT: { sample: 'Darjeeling' },
      TRIP_NAME: { sample: 'Darjeeling: Queen of the Hills' },
      CALLED_AT: { sample: '11 Oct · 17:05' },
      SUPPORT_PHONE: { sample: '+91 33 4000 0000' },
      USER_PHONE: { sample: '+91 98300 12345' },
      SLOT_1_LABEL: { sample: 'Today, Sun 11 Oct · 18:00–20:00' },
      SLOT_1_URL: { sample: 'https://ghumbo.com/callback?slot=1' },
      SLOT_2_LABEL: { sample: 'Tomorrow, Mon 12 Oct · 10:00–12:00' },
      SLOT_2_URL: { sample: 'https://ghumbo.com/callback?slot=2' },
      SLOT_3_LABEL: { sample: 'Tomorrow, Mon 12 Oct · 16:00–18:00' },
      SLOT_3_URL: { sample: 'https://ghumbo.com/callback?slot=3' },
      SEATS_LEFT: { sample: '4' },
      DEPARTURE_DATE: { sample: '26 Dec' },
      DEPARTURE_DATES: { sample: 'SAT 26 DEC → TUE 29 DEC 2026' },
      BOOKING_REF: { sample: 'GH-26DEC-4821' },
    },
    footer: {
      reason: "You're getting this because you requested a seat on a Ghumbo trip.",
      lines: ["Trip updates can't be turned off while a request is open."],
    },
    body: () => {
      const slot = (i, pad) =>
        `<tr><td style="padding:${pad}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td bgcolor="${C.white}" style="background:${C.white};border:${i === 1 ? `2px solid ${C.navy}` : `1.5px solid ${C.ink}`};border-radius:6px;text-align:center"><a href="${v(`SLOT_${i}_URL`)}" style="display:block;padding:14px 12px;font:700 16px/20px ${SANS};color:${C.ink};text-decoration:none">${v(`SLOT_${i}_LABEL`)}</a></td></tr></table></td></tr>`;
      return (
        kicker(`Missed call · ${v('CALLED_AT')}`) +
        h1('We tried calling you') +
        p(`We rang from ${v('SUPPORT_PHONE')} about your ${v('TRIP_SHORT')} request and couldn’t get through. Pick a time below and we’ll call you back on ${v('USER_PHONE')}.`, '0 0 32px') +
        h2('Pick a callback time', '0 0 16px') +
        slot(1, '0 0 12px') + slot(2, '0 0 12px') + slot(3, '0 0 8px') +
        note(`All times IST. Rather call us? <a href="tel:${v('SUPPORT_PHONE')}" style="color:${C.navy};font-weight:600">${v('SUPPORT_PHONE')}</a>`, '0 0 24px') +
        callout(
          `Seats are going on ${v('DEPARTURE_DATE')}`,
          `Only ${v('SEATS_LEFT')} seats left on this date. Your request stays in the queue, but a seat is only held once we talk.`,
          C.amberFg,
        ) +
        `<tr><td style="padding:0">${kv([
          ['Reference', v('BOOKING_REF'), { mono: true }],
          ['Trip', v('TRIP_NAME')],
          ['Departure', v('DEPARTURE_DATES'), { mono: true }],
          ['Status', badge('We called you', 'outline')],
        ])}</td></tr>`
      );
    },
  },

  // 4 · Seat confirmed
  {
    alias: 'trip-seat-confirmed',
    name: 'Trips · 4 Seat confirmed',
    from: SENDERS.trips,
    subject: `You’re booked: ${v('TRIP_SHORT')}, ${v('DEPARTURE_DATE')}`,
    preheader: 'Deposit received. Your pickup point and coordinator are inside.',
    variables: {
      ...user,
      TRIP_SHORT: { sample: 'Darjeeling' },
      DEPARTURE_DATE: { sample: 'Sat 26 Dec' },
      BOOKING_REF: { sample: 'GH-26DEC-4821' },
      SEATS_TEXT: { sample: 'Two seats' },
      FROM_POINT: { sample: 'NJP or Bagdogra (IXB)' },
      DURATION_PAX: { sample: '4D / 3N · 2 adults' },
      DEPARTURE_DATES: { sample: 'SAT 26 DEC → TUE 29 DEC 2026' },
      PICKUP: { sample: '11:00 · NJP station / Bagdogra airport' },
      LEAVES_AT: { sample: '11:30 sharp' },
      STAY: { sample: 'Family-run homestay below Chowrasta' },
      DEPOSIT_AMOUNT: { sample: '₹5,000' },
      BALANCE_DUE_DATE: { sample: 'Sat 19 Dec 2026' },
      TRIP_TOTAL: { sample: '₹18,998 · 2 adults · GST included' },
      COORDINATOR_NAME: { sample: 'Pemba Sherpa' },
      COORDINATOR_NOTE: { sample: 'With the group all four days. Handles tickets, timings and the 04:00 start for Tiger Hill.' },
      TRIP_URL: { sample: 'https://ghumbo.com/my-trips/GH-26DEC-4821' },
      TRIP_PACK_DATE: { sample: 'Sat 19 Dec' },
    },
    footer: {
      reason: "You're getting this because your seat on a Ghumbo trip is confirmed.",
      lines: ["Trip updates can't be turned off before your trip ends."],
    },
    body: () =>
      kicker('Seat confirmed') +
      h1(`You’re going to ${v('TRIP_SHORT')}`) +
      p(`Deposit received, ${v('USER_NAME')}. ${v('SEATS_TEXT')} on the ${v('DEPARTURE_DATE')} departure are yours. Here’s everything for the day you arrive.`) +
      card(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="font:600 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.red}">BOARDING PASS</td><td style="text-align:right;font:600 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.ink}">${v('BOOKING_REF')}</td></tr></table>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0"><tr><td style="vertical-align:top">${label('From')}<p style="margin:0;font:800 20px/1.2 ${SANS};color:${C.ink}">${v('FROM_POINT')}</p></td><td style="vertical-align:top;text-align:right">${label('To')}<p style="margin:0;font:800 20px/1.2 ${SANS};color:${C.ink}">${v('TRIP_SHORT')}</p></td></tr></table>` +
          `<p style="margin:0 0 12px;font:500 13px/1.3 ${MONO};letter-spacing:0.04em;color:${C.muted}">${v('DURATION_PAX')}</p>` +
          kv([
            ['Dates', v('DEPARTURE_DATES'), { mono: true }],
            ['Pickup', v('PICKUP')],
            ['Leaves', v('LEAVES_AT'), { mono: true }],
            ['Stay', v('STAY')],
          ]),
      ) +
      h2('Payment') +
      `<tr><td style="padding:0 0 24px">${kv([
        ['Deposit', `${v('DEPOSIT_AMOUNT')} ${badge('Received')}`],
        ['Balance due', v('BALANCE_DUE_DATE'), { mono: true }],
        ['Trip total', v('TRIP_TOTAL')],
      ])}</td></tr>` +
      callout(`Your coordinator: ${v('COORDINATOR_NAME')}`, v('COORDINATOR_NOTE')) +
      button(v('TRIP_URL'), 'View my trip →') +
      note(`Your trip pack, with a packing list, arrives on ${v('TRIP_PACK_DATE')}.`, '0'),
  },

  // 5 · Trip pack
  {
    alias: 'trip-pack',
    name: 'Trips · 5 Trip pack (7 days before)',
    from: SENDERS.trips,
    subject: `Your ${v('TRIP_SHORT')} trip pack: 7 days to go`,
    preheader: 'Pickup details, day by day and what to pack.',
    variables: {
      ...user,
      TRIP_SHORT: { sample: 'Darjeeling' },
      DEPARTURE_DATE: { sample: 'Sat 26 Dec' },
      HERO_IMAGE_URL: { sample: 'https://placehold.co/1072x480/1F3A5F/F2F4EC/png?text=Trip+hero+photo' },
      HERO_IMAGE_ALT: { sample: 'Kanchenjunga at sunrise from Tiger Hill' },
      PICKUP_POINT: { sample: 'NJP station / Bagdogra airport' },
      PICKUP_TIME: { sample: 'SAT 26 DEC · 11:00' },
      LEAVES_AT: { sample: '11:30 sharp' },
      COORDINATOR_NAME: { sample: 'Pemba Sherpa' },
      COORDINATOR_PHONE: { sample: '+91 98000 00000' },
      ...rowVars('DAY', sampleRows.itinerary([
          ['01', 'SAT 26 DEC', 'Pickup at 11:00, drive up via Kurseong, evening walk on the Mall.'],
          ['02', 'SUN 27 DEC', 'Tiger Hill sunrise at 04:00, Ghum Monastery, Batasia Loop and the optional toy train.'],
          ['03', 'MON 28 DEC', 'Mountaineering Institute, red pandas at the zoo, Happy Valley tea, Peace Pagoda.'],
          ['04', 'TUE 29 DEC', 'Slow breakfast, drive down, drop at NJP / Bagdogra by 13:00.'],
        ])),
      HEADS_UP_TITLE: { sample: 'December nights are near freezing at Tiger Hill' },
      HEADS_UP_BODY: { sample: 'Wear every layer you packed for the 04:00 sunrise, then peel off by lunch.' },
      ...rowVars('PACK', sampleRows.checklist([
          ['Warm layers', 'Jacket, cap and gloves'],
          ['Walking shoes', 'Steps, slopes, tea terraces'],
          ['Photo ID', 'For homestay check-in'],
          ['Cash for meals', 'About ₹600–700 a day'],
          ['Power bank', 'Cold drains batteries fast'],
          ['Daypack and bottle', 'For the jeep days'],
        ])),
      TRIP_URL: { sample: 'https://ghumbo.com/my-trips/GH-26DEC-4821' },
    },
    footer: {
      reason: "You're getting this because your seat on a Ghumbo trip is confirmed.",
      lines: ["Trip updates can't be turned off before your trip ends."],
    },
    body: () =>
      kicker('Trip pack · 7 days to go') +
      h1(`Seven sleeps to ${v('TRIP_SHORT')}`) +
      p(`Everything for ${v('DEPARTURE_DATE')} in one place, ${v('USER_NAME')}. Screenshot the pickup bit.`) +
      photo(v('HERO_IMAGE_URL'), v('HERO_IMAGE_ALT'), v('HERO_IMAGE_ALT'), '0 0 32px') +
      h2('Pickup') +
      `<tr><td style="padding:0 0 32px">${kv([
        ['Where', v('PICKUP_POINT')],
        ['When', v('PICKUP_TIME'), { mono: true }],
        ['Leaves', v('LEAVES_AT'), { mono: true }],
        ['Coordinator', v('COORDINATOR_NAME')],
        ['Phone', `<a href="tel:${v('COORDINATOR_PHONE')}" style="color:${C.navy}">${v('COORDINATOR_PHONE')}</a>`, { mono: true }],
      ])}</td></tr>` +
      h2('Day by day') +
      rowSlots('DAY', '24px') +
      callout(v('HEADS_UP_TITLE'), v('HEADS_UP_BODY'), C.red, '0 0 32px') +
      h2('What to pack') +
      rowSlots('PACK', '32px') +
      button(v('TRIP_URL'), 'View my trip →') +
      note('Want an add-on like the toy train? Reply to this email and we’ll sort it.', '0'),
  },

  // 6 · See you tomorrow
  {
    alias: 'trip-departure-tomorrow',
    name: 'Trips · 6 See you tomorrow',
    from: SENDERS.trips,
    subject: `See you tomorrow at ${v('PICKUP_TIME')}, ${v('USER_NAME')}`,
    preheader: `Pickup at ${v('PICKUP_POINT')}. Everything for the morning on one screen.`,
    variables: {
      ...user,
      DEPARTURE_DATE: { sample: 'SAT 26 DEC' },
      BOOKING_REF: { sample: 'GH-26DEC-4821' },
      PICKUP_TIME: { sample: '11:00' },
      LEAVES_AT: { sample: '11:30 sharp' },
      PICKUP_POINT: { sample: 'NJP station / Bagdogra airport' },
      COORDINATOR_NAME: { sample: 'Pemba Sherpa' },
      COORDINATOR_PHONE: { sample: '+91 98000 00000' },
      HEADS_UP_TITLE: { sample: 'Set a 4 am alarm for Sunday' },
      HEADS_UP_BODY: { sample: 'Jeeps leave for Tiger Hill at 04:00 on Sun 27 Dec. Sunrise over Kanchenjunga waits for no one.' },
      ...rowVars('CHECK', sampleRows.checklist([
          ['Photo ID', 'Aadhaar, passport or driving licence'],
          ['Warm layers', 'Jacket, cap, gloves and wool socks'],
          ['Cash for lunches and dinners', 'About ₹600–700 a day; small notes help'],
          ['Charged phone and power bank', 'Long drive, longer photo days'],
        ])),
      TRIP_URL: { sample: 'https://ghumbo.com/my-trips/GH-26DEC-4821' },
    },
    footer: {
      reason: "You're getting this because your seat on a Ghumbo trip is confirmed.",
      lines: ["Trip updates can't be turned off before your trip ends."],
    },
    body: () =>
      kicker('Leaves tomorrow') +
      h1(`See you tomorrow, ${v('USER_NAME')}`) +
      p('Bags packed? Here’s the morning on one screen.') +
      `<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${C.dark};border-radius:6px"><tr><td bgcolor="${C.dark}" style="padding:24px;background:${C.dark};border-radius:6px">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="font:500 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.dash}">TOMORROW · ${v('DEPARTURE_DATE')}</td><td style="text-align:right;font:500 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.dash}">${v('BOOKING_REF')}</td></tr></table>` +
      `<p style="margin:16px 0 4px;font:500 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.dash}">PICKUP</p><p style="margin:0 0 16px;font:600 48px/1 ${MONO};color:${C.yellow}">${v('PICKUP_TIME')}</p>` +
      `<p style="margin:0;padding-top:12px;border-top:1px solid ${C.darkRule};font:500 14px/1.6 ${MONO};letter-spacing:0.04em;text-transform:uppercase;color:${C.paper}">Leaves ${v('LEAVES_AT')}<br>Meet at ${v('PICKUP_POINT')}</p>` +
      `</td></tr></table></td></tr>` +
      callout(
        `Your coordinator: ${v('COORDINATOR_NAME')}`,
        `Train running late? Call <a href="tel:${v('COORDINATOR_PHONE')}" style="color:${C.navy};font-weight:600">${v('COORDINATOR_PHONE')}</a>, not the office.`,
        C.navy,
        '0 0 16px',
      ) +
      callout(v('HEADS_UP_TITLE'), v('HEADS_UP_BODY'), C.red, '0 0 32px') +
      h2('Last-minute checklist') +
      rowSlots('CHECK', '24px') +
      button(v('TRIP_URL'), 'View my trip →', '0'),
  },

  // 7 · After the trip
  {
    alias: 'lifecycle-after-trip',
    name: 'Lifecycle · 7 After the trip',
    from: SENDERS.hello,
    subject: `Welcome back from ${v('TRIP_SHORT')}, ${v('USER_NAME')}`,
    preheader: 'How was it? One tap tells us. Plus three trips for what’s next.',
    variables: {
      ...user,
      TRIP_SHORT: { sample: 'Darjeeling' },
      TRIP_END_DATE: { sample: '29 Dec 2026' },
      REVIEW_URL: { sample: 'https://ghumbo.com/trips/darjeeling-queen-of-the-hills-budget/review' },
      REVIEWER_DISPLAY: { sample: 'Riya S.' },
      ...tripSlots('NEXT', 3, (i) => NEXT_TRIPS[i - 1]),
      ...unsub,
    },
    footer: { reason: "You're getting this because you travelled with Ghumbo.", unsubscribe: true },
    body: () =>
      kicker(`Trip complete · ${v('TRIP_END_DATE')}`) +
      h1('Welcome back from the&#160;hills') +
      p(`Thanks for travelling with us, ${v('USER_NAME')}. We hope ${v('TRIP_SHORT')} was everything you wanted.`) +
      card(
        `<h2 style="margin:0 0 8px;font:800 22px/1.2 ${SANS};color:${C.ink}">How was ${v('TRIP_SHORT')}?</h2>` +
          smallP(`One tap starts your review with the score filled in. It shows on the trip page as ${v('REVIEWER_DISPLAY')} and words and photos are optional.`, C.muted, '0 0 16px') +
          ratingRow(v('REVIEW_URL')),
        '0 0 32px',
      ) +
      h2('Where next?', '0 0 4px') +
      note('Fresh dates coming up. Per person, twin sharing, GST included.', '0 0 16px') +
      [1, 2, 3]
        .map((i) =>
          tripCard({
            img: v(`NEXT_${i}_IMAGE_URL`),
            alt: v(`NEXT_${i}_IMAGE_ALT`),
            meta: v(`NEXT_${i}_META`),
            name: v(`NEXT_${i}_NAME`),
            url: v(`NEXT_${i}_URL`),
            line: `Next departure ${v(`NEXT_${i}_DATE`)}`,
            price: `From ${v(`NEXT_${i}_PRICE`)} per person`,
          }),
        )
        .join('') +
      button('https://ghumbo.com/trips', 'See next trips →', '12px 0 0'),
  },

  // 8 · Waitlist open
  {
    alias: 'lifecycle-waitlist-open',
    name: 'Lifecycle · 8 Waitlist open',
    from: SENDERS.hello,
    subject: `${v('DESTINATION')} is open. You’re first in line.`,
    preheader: `The waitlist gets first access until ${v('ACCESS_END_DATE')}, then seats go public.`,
    variables: {
      DESTINATION: { sample: 'Sikkim' },
      DESTINATION_BLURB: { sample: 'Monasteries, high lakes and mountain roads, right next door to Darjeeling.' },
      DEPARTURE_DATES: { sample: '06 Mar · 13 Mar · 20 Mar' },
      PRICE_FROM: { sample: '₹14,999' },
      GROUP_SIZE: { sample: 'Up to 12' },
      ACCESS_END_DATE: { sample: 'Fri 15 Jan, 10:00' },
      DESTINATION_URL: { sample: 'https://ghumbo.com/sikkim' },
      ...unsub,
    },
    footer: { reason: `You're getting this because you joined the ${v('DESTINATION')} waitlist.`, unsubscribe: true },
    body: () =>
      kicker(`Waitlist · ${v('DESTINATION')}`) +
      h1(`${v('DESTINATION')} is open`) +
      p(`You asked us to tell you first, so we are. ${v('DESTINATION_BLURB')}`) +
      card(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="font:500 12px/1.2 ${MONO};letter-spacing:0.08em;color:${C.red}">NEW ON THE BOARD</td><td style="text-align:right">${badge('Waitlist first', 'amber')}</td></tr></table>` +
          `<p style="margin:12px 0 16px;font:800 30px/1.1 ${SANS};color:${C.ink}">${v('DESTINATION')}</p>` +
          kv([
            ['Departures', v('DEPARTURE_DATES'), { mono: true }],
            ['From, per person', v('PRICE_FROM'), { mono: true }],
            ['Group', v('GROUP_SIZE')],
          ], 150),
      ) +
      callout(
        'You get first access',
        `The waitlist can request seats until ${v('ACCESS_END_DATE')}. After that, seats go public. Groups are small, so early requests get first pick of dates.`,
        C.amberFg,
      ) +
      button(v('DESTINATION_URL'), `See ${v('DESTINATION')} trips →`) +
      note('Same deal as always: request a seat, we call within 24 hours, no payment online.', '0'),
  },

  // 9 · Review reminder
  {
    alias: 'lifecycle-review-reminder',
    name: 'Lifecycle · 9 Review reminder',
    from: SENDERS.hello,
    subject: 'Two minutes for the next group?',
    preheader: `Your ${v('TRIP_SHORT')} rating helps them pick a date.`,
    variables: {
      ...user,
      TRIP_SHORT: { sample: 'Darjeeling' },
      TRIP_END_DATE: { sample: '29 Dec 2026' },
      DAYS_SINCE: { sample: 'five' },
      REVIEW_URL: { sample: 'https://ghumbo.com/trips/darjeeling-queen-of-the-hills-budget/review' },
      REVIEWER_DISPLAY: { sample: 'Riya S.' },
      ...unsub,
    },
    footer: { reason: "You're getting this because you travelled with Ghumbo.", unsubscribe: true },
    body: () =>
      kicker(`Trip complete · ${v('TRIP_END_DATE')}`) +
      h1('Two minutes for the next group?') +
      p(`Hi ${v('USER_NAME')}, it’s been ${v('DAYS_SINCE')} days since you got back. Your rating helps the next group pick their dates.`) +
      card(
        `<h2 style="margin:0 0 8px;font:800 22px/1.2 ${SANS};color:${C.ink}">How was ${v('TRIP_SHORT')}?</h2>` +
          smallP(`One tap starts your review with the score filled in. It shows on the trip page as ${v('REVIEWER_DISPLAY')} and words and photos are optional.`, C.muted, '0 0 16px') +
          ratingRow(v('REVIEW_URL')),
      ) +
      button(v('REVIEW_URL'), 'Write my review →', '0 0 20px') +
      note(`Only travellers can write a review, so every review on Ghumbo is from someone who went.`, '0 0 12px') +
      note('This is the only reminder we’ll send.', '0'),
  },

  // 11 · Deposit receipt
  {
    alias: 'billing-deposit-receipt',
    name: 'Billing · 11 Deposit receipt',
    from: SENDERS.billing,
    subject: `Receipt for your deposit · ${v('BOOKING_REF')}`,
    preheader: `${v('DEPOSIT_AMOUNT')} received for ${v('TRIP_SHORT')}, ${v('DEPARTURE_DATE')}.`,
    variables: {
      ...user,
      BOOKING_REF: { sample: 'GH-26DEC-4821' },
      TRIP_NAME: { sample: 'Darjeeling: Queen of the Hills' },
      TRIP_SHORT: { sample: 'Darjeeling' },
      DEPARTURE_DATE: { sample: 'Sat 26 Dec' },
      TRAVELLERS: { sample: '2 adults' },
      DEPOSIT_AMOUNT: { sample: '₹5,000' },
      RECEIPT_NUMBER: { sample: 'GHR-2026-000148' },
      PAID_AT: { sample: 'MON 12 OCT 2026 · 11:32 IST' },
      PAYMENT_METHOD: { sample: 'UPI · riya@okaxis' },
      TRIP_TOTAL: { sample: '₹18,998' },
      BALANCE_AMOUNT: { sample: '₹13,998' },
      BALANCE_DUE_DATE: { sample: 'Sat 19 Dec 2026' },
      INVOICE_URL: { sample: 'https://ghumbo.com/my-trips/GH-26DEC-4821/invoice' },
    },
    footer: {
      reason: "You're getting this because you made a payment to Ghumbo.",
      lines: ["Billing emails can't be turned off."],
      gstin: true,
    },
    body: () =>
      kicker('Payment receipt') +
      h1('Deposit received, thanks') +
      p(`Hi ${v('USER_NAME')}, here’s the receipt for the deposit you paid on our call. Your GST invoice is linked below. Keep it for your records.`) +
      card(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="vertical-align:top">${label('Amount paid')}${bigMono(v('DEPOSIT_AMOUNT'), 30)}</td><td style="vertical-align:top;text-align:right">${badge('Paid')}</td></tr></table>` +
          `<div style="height:20px;line-height:20px">&#160;</div>` +
          kv([
            ['Receipt no.', v('RECEIPT_NUMBER'), { mono: true }],
            ['Paid on', v('PAID_AT'), { mono: true }],
            ['Method', v('PAYMENT_METHOD')],
            ['Booking', v('BOOKING_REF'), { mono: true }],
            ['Trip', `${v('TRIP_NAME')} · ${v('TRAVELLERS')}`],
          ], 140),
      ) +
      h2('What’s left to pay') +
      `<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">` +
      `<tr><td style="padding:10px 16px 10px 0;border-top:2px dashed ${C.dash};font:400 15px/1.5 ${SANS};color:${C.ink}">Trip total · GST included</td><td style="padding:10px 0;border-top:2px dashed ${C.dash};text-align:right;font:600 15px/1.5 ${MONO};color:${C.ink}">${v('TRIP_TOTAL')}</td></tr>` +
      `<tr><td style="padding:10px 16px 10px 0;border-top:1px solid ${C.rule};font:400 15px/1.5 ${SANS};color:${C.ink}">Deposit paid</td><td style="padding:10px 0;border-top:1px solid ${C.rule};text-align:right;font:600 15px/1.5 ${MONO};color:${C.ink}">− ${v('DEPOSIT_AMOUNT')}</td></tr>` +
      `<tr><td style="padding:12px 16px 12px 0;border-top:1.5px solid ${C.ink};font:700 16px/1.5 ${SANS};color:${C.ink}">Balance due by ${v('BALANCE_DUE_DATE')}</td><td style="padding:12px 0;border-top:1.5px solid ${C.ink};text-align:right;font:600 16px/1.5 ${MONO};color:${C.ink}">${v('BALANCE_AMOUNT')}</td></tr>` +
      `</table></td></tr>` +
      button(v('INVOICE_URL'), 'Download invoice (PDF) →') +
      note('Something look wrong? Reply with your receipt number and we’ll sort it out.', '0'),
  },
].map((t) => ({ ...t, replyTo: REPLY_TO }));
