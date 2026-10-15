/**
 * Seeds countries → destinations → tours → departures → prices from JSON files in `seeds/`.
 *
 *   npm run seed                      # all seeds/*.json, alphabetical
 *   npm run seed -- seeds/west-bengal.json
 *
 * Idempotent: rows are matched on natural keys (country code, destination slug, tour slug,
 * departure tour + start_date, price departure + type + currency) and updated in place.
 * Nothing is deleted. Runs in a single transaction.
 *
 * Ordering: new tours get monotonic ULIDs, so `ORDER BY id` returns tours in the order
 * they appear in the seed file. (`created_at` is identical for every row, since Postgres
 * `now()` is the transaction start time.) Re-running keeps existing ids, so order is stable.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  DataSource,
  type DataSourceOptions,
  type EntityManager,
} from 'typeorm';
import { monotonicFactory } from 'ulid';
import z from 'zod';
import dbConfig from '../src/configs/db.config.js';
import { CountryEntity } from '../src/entities/countries.entity.js';
import { DestinationEntity } from '../src/entities/destinations.entity.js';
import { TourEntity } from '../src/entities/tours.entity.js';
import { TourDepartureEntity } from '../src/entities/tour_departures.entity.js';
import { TourDeparturePriceEntity } from '../src/entities/tour_departure_prices.entity.js';
import { Asset, ECURRENCY } from '../src/schemas/misc.schema.js';
import { ECountryStatus } from '../src/schemas/countries.schema.js';
import { EDestinationStatus } from '../src/schemas/destinations.schema.js';
import {
  ETourAudience,
  ETourStatus,
  ETourTier,
  Itinerary,
  TourInclusion,
} from '../src/schemas/tours.schema.js';
import { ETourDepartureStatus } from '../src/schemas/tour_departures.schema.js';
import { ETourDeparturePriceType } from '../src/schemas/tour_departure_prices.schema.js';

const SEEDS_DIR = path.resolve(process.cwd(), 'seeds');

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.string().regex(/^\d+(\.\d{1,2})?$/);

const SeedPrice = z.object({
  type: z.enum(ETourDeparturePriceType),
  currency: z.enum(ECURRENCY),
  amount: money,
});

const SeedDeparture = z
  .object({
    start_date: date,
    end_date: date,
    status: z.enum(ETourDepartureStatus).default(ETourDepartureStatus.OPEN),
    capacity: z.number().int().positive(),
    prices: z.array(SeedPrice),
  })
  .refine((d) => d.end_date >= d.start_date, 'end_date before start_date');

const SeedTour = z
  .object({
    slug,
    name: z.string().min(1).max(255),
    tier: z.enum(ETourTier),
    audience: z.enum(ETourAudience).default(ETourAudience.OPEN),
    status: z.enum(ETourStatus).default(ETourStatus.DRAFT),
    overview: z.string().min(1),
    duration_days: z.number().int().positive(),
    duration_nights: z.number().int().nonnegative(),
    is_recommended: z.boolean().default(false),
    itinerary: Itinerary,
    inclusions: z.array(TourInclusion).default([]),
    exclusions: z.array(TourInclusion).default([]),
    assets: z.array(Asset).default([]),
    departures: z.array(SeedDeparture).default([]),
  })
  .refine((t) => t.duration_nights <= t.duration_days, 'nights > days')
  .refine(
    (t) => t.itinerary.days.length === t.duration_days,
    'itinerary day count != duration_days',
  );

const SeedDestination = z.object({
  slug,
  name: z.string().min(1).max(255),
  status: z.enum(EDestinationStatus).default(EDestinationStatus.COMING_SOON),
  overview: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  assets: z.array(Asset).default([]),
  tours: z.array(SeedTour).default([]),
});

const SeedFile = z.object({
  country: z.object({
    code: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(1).max(255),
    status: z.enum(ECountryStatus).default(ECountryStatus.COMING_SOON),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    assets: z.array(Asset).default([]),
  }),
  destinations: z.array(SeedDestination),
});

type TSeedFile = z.infer<typeof SeedFile>;

const nextId = monotonicFactory();
const stats = {
  created: {} as Record<string, number>,
  updated: {} as Record<string, number>,
};
const count = (kind: 'created' | 'updated', entity: string) => {
  stats[kind][entity] = (stats[kind][entity] ?? 0) + 1;
};

async function seedFile(em: EntityManager, seed: TSeedFile) {
  const { country: c, destinations } = seed;

  let country = await em.findOneBy(CountryEntity, { code: c.code });
  count(country ? 'updated' : 'created', 'countries');
  country = em.merge(CountryEntity, country ?? em.create(CountryEntity), {
    code: c.code,
    name: c.name,
    status: c.status,
    latitude: c.latitude,
    longitude: c.longitude,
    assets: c.assets,
  });
  country = await em.save(country);

  for (const d of destinations) {
    let destination = await em.findOneBy(DestinationEntity, { slug: d.slug });
    count(destination ? 'updated' : 'created', 'destinations');
    destination = em.merge(
      DestinationEntity,
      destination ?? em.create(DestinationEntity),
      {
        countryId: country.id,
        slug: d.slug,
        name: d.name,
        status: d.status,
        overview: d.overview,
        latitude: d.latitude,
        longitude: d.longitude,
        assets: d.assets,
      },
    );
    destination = await em.save(destination);

    for (const t of d.tours) {
      let tour = await em.findOneBy(TourEntity, { slug: t.slug });
      count(tour ? 'updated' : 'created', 'tours');
      tour = em.merge(
        TourEntity,
        tour ?? em.create(TourEntity, { id: nextId() }),
        {
          destinationId: destination.id,
          slug: t.slug,
          name: t.name,
          tier: t.tier,
          audience: t.audience,
          status: t.status,
          overview: t.overview,
          durationDays: t.duration_days,
          durationNights: t.duration_nights,
          isRecommended: t.is_recommended,
          itinerary: t.itinerary,
          inclusions: t.inclusions,
          exclusions: t.exclusions,
          assets: t.assets,
        },
      );
      tour = await em.save(tour);

      for (const dep of t.departures) {
        let departure = await em.findOneBy(TourDepartureEntity, {
          tourId: tour.id,
          startDate: dep.start_date,
        });
        count(departure ? 'updated' : 'created', 'tour_departures');
        departure = em.merge(
          TourDepartureEntity,
          departure ?? em.create(TourDepartureEntity, { id: nextId() }),
          {
            tourId: tour.id,
            startDate: dep.start_date,
            endDate: dep.end_date,
            status: dep.status,
            capacity: dep.capacity,
          },
        );
        departure = await em.save(departure);

        if (dep.prices.length) {
          await em.upsert(
            TourDeparturePriceEntity,
            dep.prices.map((p) => ({
              departureId: departure.id,
              type: p.type,
              currency: p.currency,
              amount: p.amount,
            })),
            ['departureId', 'type', 'currency'],
          );
          stats.updated['tour_departure_prices (upserted)'] =
            (stats.updated['tour_departure_prices (upserted)'] ?? 0) +
            dep.prices.length;
        }
      }
    }
  }
}

function loadSeeds(args: string[]): { file: string; seed: TSeedFile }[] {
  const files = args.length
    ? args.map((f) => path.resolve(process.cwd(), f))
    : readdirSync(SEEDS_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => path.join(SEEDS_DIR, f));

  if (!files.length) throw new Error(`No seed files found in ${SEEDS_DIR}`);

  return files.map((file) => {
    const parsed = SeedFile.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    if (!parsed.success) {
      throw new Error(
        `Invalid seed file ${file}:\n${z.prettifyError(parsed.error)}`,
      );
    }
    return { file, seed: parsed.data };
  });
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--yes');

  if (process.env.ENV !== 'local' && !process.argv.includes('--yes')) {
    throw new Error(
      `ENV=${process.env.ENV ?? '(unset)'} is not local. Re-run with --yes to seed ${process.env.DB_HOST}/${process.env.DB_NAME}.`,
    );
  }

  const seeds = loadSeeds(args);

  // Same config as the app: schema synchronize runs only when ENV=local.
  const dataSource = new DataSource(dbConfig as DataSourceOptions);
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (em) => {
      for (const { file, seed } of seeds) {
        console.log(`Seeding ${path.relative(process.cwd(), file)}`);
        await seedFile(em, seed);
      }
    });
  } finally {
    await dataSource.destroy();
  }

  console.log('Created:', stats.created);
  console.log('Updated:', stats.updated);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
