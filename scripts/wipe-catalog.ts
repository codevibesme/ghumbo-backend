/**
 * Empties the tables `npm run seed` fills, so the seed can start from scratch:
 * countries, destinations, trips, trip_departures.
 *
 *   npm run wipe-catalog                        # dry run: prints row counts, deletes nothing
 *   npm run wipe-catalog -- --yes               # deletes
 *   npm run wipe-catalog -- --yes --with-bookings
 *
 * Bookings and reviews point at trips and departures, so those tables
 * (bookings, booking_travelers, trip_reviews) are
 * emptied in the same statement. If any of them hold rows the wipe stops, unless
 * --with-bookings is passed. Users, sign-in data and saved travelers are never touched.
 *
 * Plain SQL against DATABASE_URL, with no entity metadata, so it works before or after a
 * migration that adds NOT NULL columns. One transaction: all or nothing.
 */
import pg from 'pg';

const CATALOG = ['countries', 'destinations', 'trips', 'trip_departures'];
const BOOKINGS = ['bookings', 'booking_travelers', 'trip_reviews'];

async function countRows(client: pg.Client, tables: string[]) {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { rows } = await client.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM "${table}"`,
    );
    counts[table] = Number(rows[0].n);
  }
  return counts;
}

async function main() {
  const confirm = process.argv.includes('--yes');
  const withBookings = process.argv.includes('--with-bookings');

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const target = `${new URL(url).hostname}${new URL(url).pathname}`;

  const client = new pg.Client({
    connectionString: url,
    ssl:
      process.env.ENV === 'production' ? { rejectUnauthorized: true } : false,
  });
  await client.connect();

  try {
    const catalog = await countRows(client, CATALOG);
    const bookings = await countRows(client, BOOKINGS);
    const bookingRows = Object.values(bookings).reduce((a, b) => a + b, 0);

    console.log(`Target: ${target} (ENV=${process.env.ENV ?? 'unset'})`);
    console.log('Catalog rows:', catalog);
    console.log('Booking and review rows:', bookings);

    if (bookingRows > 0 && !withBookings) {
      throw new Error(
        `${bookingRows} booking/review rows reference the catalog. Re-run with --with-bookings to delete them too.`,
      );
    }

    // Postgres won't TRUNCATE a referenced table unless every table pointing at it is in
    // the same statement, even when those are empty, so the booking tables always go in.
    // Without --with-bookings we only get here when they hold no rows.
    const tables = [...CATALOG, ...BOOKINGS];

    if (!confirm) {
      console.log(`Dry run. Re-run with --yes to empty: ${tables.join(', ')}.`);
      return;
    }

    // No CASCADE: if any other table references these, Postgres refuses instead of
    // emptying it too.
    await client.query('BEGIN');
    await client.query(
      `TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY`,
    );
    await client.query('COMMIT');

    console.log(`Emptied: ${tables.join(', ')}. Now run the seed.`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
