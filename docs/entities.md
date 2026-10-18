# Database Entities

PostgreSQL schema for the Ghumbo backend, defined as TypeORM entities in `src/entities/`. All entities are registered in `src/entities/index.ts`.

## Relationships

```mermaid
erDiagram
    countries ||--o{ destinations : "has"
    destinations ||--o{ trips : "has"
    trips ||--o{ trip_departures : "has"
    trip_departures ||--o{ trip_departure_prices : "has"
    trips ||--o{ booking_requests : "receives"
    trip_departures |o--o{ booking_requests : "optionally for"
    users |o--o{ booking_requests : "optionally by"
    trips ||--o{ trip_reviews : "has"
    users |o--o{ trip_reviews : "written by"
    users ||--o{ auth_identities : "has"
    users ||--o{ auth_sessions : "has"
    users |o--o{ travelers : "saves"
```

| Child → Parent | FK column | On delete |
|---|---|---|
| `destinations` → `countries` | `country_id` | `RESTRICT` |
| `trips` → `destinations` | `destination_id` | `RESTRICT` |
| `trip_departures` → `trips` | `trip_id` | `CASCADE` |
| `trip_departure_prices` → `trip_departures` | `departure_id` | `CASCADE` |
| `booking_requests` → `trips` | `trip_id` | `RESTRICT` |
| `booking_requests` → `trip_departures` | `trip_departure_id` | `SET NULL` |
| `booking_requests` → `users` | `user_id` | `SET NULL` |
| `trip_reviews` → `trips` | `trip_id` | `CASCADE` |
| `trip_reviews` → `users` | `user_id` | `SET NULL` |
| `auth_identities` → `users` | `user_id` | `CASCADE` |
| `auth_sessions` → `users` | `user_id` | `CASCADE` |
| `travelers` → `users` | `user_id` | `CASCADE` |

Effectively: a country, destination, or trip cannot be deleted while it has children / booking requests. Deleting a trip with no booking requests removes its departures, their prices, and its reviews. Deleting a user removes their auth identities, sessions and saved travelers but keeps their booking requests and reviews (detached).

## Conventions

- **Naming:** DB tables and columns are `snake_case`; TypeORM properties are `camelCase`. Every `@Column` sets `name` explicitly.
- **Primary keys:**
  - Reference data (`countries`, `destinations`, `trip_departure_prices`) uses `integer` identity columns.
  - Everything else uses a ULID stored as `varchar(26)`, generated in the app via a property initializer (`id = ulid()`).
- **Timestamps:** `created_at` / `updated_at` are `timestamptz`, managed by `@CreateDateColumn` / `@UpdateDateColumn`.
- **Calendar dates** (`date` columns) are typed as `string` (`'YYYY-MM-DD'`), never JS `Date`, to avoid timezone shifts.
- **Money** is `numeric(12,2)` and typed as `string` — pg returns numerics as strings to preserve precision. Don't do float math on it.
- **Constraint names:**

  | Kind | Pattern | Example |
  |---|---|---|
  | Foreign key | `fk_<table>_<column>` | `fk_booking_requests_user_id` |
  | Index | `idx_<table>_<columns>` | `idx_trips_destination_id` |
  | Check | `chk_<table>_<what>` | `chk_trip_departures_dates` |
  | Unique | `uq_<table>_<columns>` | `uq_trip_departure_prices_departure_type_currency` |
- **FK columns are indexed** (Postgres does not do this automatically).

---

## Catalog

### `countries` — `CountryEntity`

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `integer` identity | | | PK |
| `status` | `status` | enum `ECountryStatus` | | `coming_soon` | |
| `name` | `name` | `varchar(255)` | | | |
| `code` | `code` | `char(2)` | | | Unique. ISO 3166-1 alpha-2, uppercase |
| `latitude` | `latitude` | `double precision` | | | |
| `longitude` | `longitude` | `double precision` | | | |
| `assets` | `assets` | `jsonb` (`TAsset[]`) | | `'[]'` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Checks:**
- `chk_countries_code_upper`: `code = upper(code)`
- `chk_countries_latitude`: latitude between -90 and 90
- `chk_countries_longitude`: longitude between -180 and 180

### `destinations` — `DestinationEntity`

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `integer` identity | | | PK |
| `country_id` | `countryId` | `integer` | | | FK → `countries.id`, indexed |
| `status` | `status` | enum `EDestinationStatus` | | `coming_soon` | |
| `name` | `name` | `varchar(255)` | | | |
| `slug` | `slug` | `varchar(255)` | | | Unique. URL slug, lowercase kebab-case |
| `overview` | `overview` | `text` | | | |
| `latitude` | `latitude` | `double precision` | | | |
| `longitude` | `longitude` | `double precision` | | | |
| `assets` | `assets` | `jsonb` (`TAsset[]`) | | `'[]'` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `uq_destinations_slug`: unique on `slug`
- `chk_destinations_slug`: `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
- `chk_destinations_latitude`: latitude between -90 and 90
- `chk_destinations_longitude`: longitude between -180 and 180

### `trips` — `TripEntity`

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `destination_id` | `destinationId` | `integer` | | | FK → `destinations.id`, indexed |
| `status` | `status` | enum `ETripStatus` | | `draft` | |
| `name` | `name` | `varchar(255)` | | | |
| `slug` | `slug` | `varchar(255)` | | | Unique. URL slug, lowercase kebab-case |
| `overview` | `overview` | `text` | | | |
| `tier` | `tier` | enum `ETripTier` | | | Price band. A tier is its own trip, not a package on one trip |
| `audience` | `audience` | enum `ETripAudience` | | `open` | Who the trip is for. `couples` trips are separate trips, sold in pairs |
| `duration_days` | `durationDays` | `integer` | | | |
| `duration_nights` | `durationNights` | `integer` | | | |
| `itinerary` | `itinerary` | `jsonb` (`TItinerary`) | | | |
| `inclusions` | `inclusions` | `jsonb` (`TTripInclusion[]`) | | `'[]'` | |
| `exclusions` | `exclusions` | `jsonb` (`TTripInclusion[]`) | | `'[]'` | |
| `assets` | `assets` | `jsonb` (`TAsset[]`) | | `'[]'` | |
| `is_recommended` | `isRecommended` | `boolean` | | `false` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `uq_trips_slug`: unique on `slug` (globally, not per destination)
- `chk_trips_slug`: `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
- `chk_trips_duration`: `duration_days > 0 AND duration_nights >= 0 AND duration_nights <= duration_days`

### `trip_departures` — `TripDepartureEntity`

A scheduled run of a trip with fixed dates and seat capacity.

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `trip_id` | `tripId` | `varchar(26)` | | | FK → `trips.id`, indexed |
| `status` | `status` | enum `ETripDepartureStatus` | | `draft` | |
| `start_date` | `startDate` | `date` (`string`) | | | |
| `end_date` | `endDate` | `date` (`string`) | | | |
| `capacity` | `capacity` | `integer` | | | |
| `booked_seats` | `bookedSeats` | `integer` | | `0` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Checks:**
- `chk_trip_departures_capacity`: `capacity > 0`
- `chk_trip_departures_booked_seats`: `booked_seats >= 0 AND booked_seats <= capacity`
- `chk_trip_departures_dates`: `end_date >= start_date`

> **Booking seats:** the check constraint is a safety net against overbooking, not the booking mechanism. Increment atomically:
> ```sql
> UPDATE trip_departures
> SET booked_seats = booked_seats + $n
> WHERE id = $id AND booked_seats + $n <= capacity
> ```
> and treat 0 affected rows as "sold out".

### `trip_departure_prices` — `TripDeparturePriceEntity`

Per-departure price, one row per (price type, currency). Prices are per person, twin sharing; there is no couple price type (couples book two adults, or a `couples` audience trip).

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `integer` identity | | | PK |
| `departure_id` | `departureId` | `varchar(26)` | | | FK → `trip_departures.id` |
| `type` | `type` | enum `ETripDeparturePriceType` | | | |
| `currency` | `currency` | enum `ECURRENCY` | | | |
| `amount` | `amount` | `numeric(12,2)` (`string`) | | | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `uq_trip_departure_prices_departure_type_currency`: unique on `(departure_id, type, currency)`. Its index also serves lookups by `departure_id`.
- `chk_trip_departure_prices_amount`: `amount >= 0`

### `booking_requests` — `BookingRequestEntity`

A lead submitted for a trip, optionally for a specific departure and optionally by a logged-in user.

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `trip_id` | `tripId` | `varchar(26)` | | | FK → `trips.id`, indexed |
| `trip_departure_id` | `tripDepartureId` | `varchar(26)` | ✓ | | FK → `trip_departures.id`, indexed. Null = general trip request |
| `user_id` | `userId` | `varchar(26)` | ✓ | | FK → `users.id`, indexed. Null = guest |
| `travel_date` | `travelDate` | `date` (`string`) | ✓ | | Preferred date when no departure is chosen |
| `name` | `name` | `varchar(100)` | | | |
| `email` | `email` | `varchar(254)` | | | |
| `phone` | `phone` | `varchar(16)` | ✓ | | E.164 |
| `traveler_count` | `travelerCount` | `integer` | | | |
| `query` | `query` | `text` | ✓ | | Free-text message from the customer |
| `status` | `status` | enum `EBookingRequestStatus` | | `new` | |
| `status_notes` | `statusNotes` | `text` | ✓ | | Internal notes |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `idx_booking_requests_status_created_at`: index on `(status, created_at)` for the admin lead list (filter by status, sort by newest)
- `chk_booking_requests_traveler_count`: `traveler_count > 0`

> The DB does not verify that `trip_departure_id` belongs to `trip_id`. Validate this in the service layer when creating a booking request.

### `trip_reviews` — `TripReviewEntity`

A customer's rating and feedback for a trip.

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `user_id` | `userId` | `varchar(26)` | ✓ | | FK → `users.id`. Null once the user is deleted |
| `trip_id` | `tripId` | `varchar(26)` | | | FK → `trips.id`, indexed |
| `rating` | `rating` | `integer` | | | 1–5 |
| `feedback` | `feedback` | `text` | ✓ | | |
| `assets` | `assets` | `jsonb` (`TAsset[]`) | | `'[]'` | Customer photos / videos |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `uq_trip_reviews_user_id_trip_id`: unique on `(user_id, trip_id)`, so a user reviews a trip at most once. Its index also serves lookups by `user_id`. Rows detached from a deleted user (`user_id` null) don't conflict, since Postgres treats nulls as distinct.
- `idx_trip_reviews_trip_id`: index on `trip_id` for listing a trip's reviews
- `chk_trip_reviews_rating`: `rating BETWEEN 1 AND 5`

> The DB does not check that the reviewer actually travelled on the trip. Enforce that in the service layer if needed.

---

## Users

### `users` — `UserEntity`

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `name` | `name` | `varchar(50)` | | | |
| `email` | `email` | `citext` | ✓ | | Unique, case-insensitive. Null for phone-only users |
| `phone` | `phone` | `varchar(16)` | ✓ | | Unique. E.164 |
| `role` | `role` | enum `EUserRole` | | `customer` | |
| `photo` | `photo` | `jsonb` (`TAsset`) | ✓ | | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

> `citext` requires the `citext` extension. TypeORM runs `CREATE EXTENSION IF NOT EXISTS citext` on startup, which needs a DB role with permission to create extensions.

### `auth_identities` — `AuthIdentityEntity`

One row per login method linked to a user (email + password, phone OTP, Google, …).

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `user_id` | `userId` | `varchar(26)` | | | FK → `users.id` |
| `provider` | `provider` | enum `EAuthIdentityProvider` | | | |
| `provider_user_id` | `providerUserId` | `varchar(255)` | | | The user's ID at the provider: email address for `email`, E.164 number for `phone`, Google `sub` for `google` |
| `password_hash` | `passwordHash` | `varchar(255)` | ✓ | | Only for `email` identities with a password |
| `is_verified` | `isVerified` | `boolean` | | `false` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |

**Constraints:**
- `uq_auth_identities_user_id_provider`: unique on `(user_id, provider)`, so a user has at most one identity per provider. Its index also serves lookups by `user_id`.
- `uq_auth_identities_provider_provider_user_id`: unique on `(provider, provider_user_id)`, so one email / phone / Google account can't be linked to two users.

> Normalize `provider_user_id` before writing (lowercase emails, E.164 phones). Unlike `users.email`, it's not `citext`.

### `auth_sessions` — `AuthSessionEntity`

One row per refresh token / logged-in device.

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `user_id` | `userId` | `varchar(26)` | | | FK → `users.id`, indexed |
| `refresh_token_hash` | `refreshTokenHash` | `char(64)` | | | Unique. SHA-256 hex of the refresh token |
| `user_agent` | `userAgent` | `text` | | | |
| `ip_address` | `ipAddress` | `inet` | | | IPv4 or IPv6 |
| `device_id` | `deviceId` | `varchar(255)` | | | |
| `expires_at` | `expiresAt` | `timestamptz` | | | |
| `revoked_at` | `revokedAt` | `timestamptz` | ✓ | | Set on logout / revocation |
| `last_used_at` | `lastUsedAt` | `timestamptz` | | `now()` | |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |

### `travelers` — `TravelerEntity`

A saved traveler profile a user can reuse across bookings (themselves, family, friends). Bookings will copy these details into their own rows at booking time, so editing or deleting a saved traveler never changes past bookings.

| Column | Property | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | `varchar(26)` | | ULID | PK |
| `user_id` | `userId` | `varchar(26)` | ✓ | | FK → `users.id`, indexed. Null when an admin creates a traveler for someone without an account |
| `is_self` | `isSelf` | `boolean` | | `false` | The account holder's own profile |
| `full_name` | `fullName` | `varchar(100)` | | | As on their ID |
| `date_of_birth` | `dateOfBirth` | `date` (`string`) | | | Child pricing uses age on the departure's start date |
| `gender` | `gender` | enum `ETravelerGender` | | | For room allocation |
| `phone` | `phone` | `varchar(16)` | ✓ | | E.164, indexed (admin lookup of returning callers). Required for a booking's lead traveler, enforced in the service |
| `email` | `email` | `citext` | ✓ | | Not unique: family members often share one |
| `emergency_contact_name` | `emergencyContactName` | `varchar(100)` | ✓ | | |
| `emergency_contact_phone` | `emergencyContactPhone` | `varchar(16)` | ✓ | | E.164 |
| `dietary_notes` | `dietaryNotes` | `text` | ✓ | | |
| `medical_notes` | `medicalNotes` | `text` | ✓ | | Health data (DPDP): collect with consent; expose only to admins and the trip's guide |
| `created_at` | `createdAt` | `timestamptz` | | `now()` | |
| `updated_at` | `updatedAt` | `timestamptz` | | `now()` | |
| `deleted_at` | `deletedAt` | `timestamptz` | ✓ | | Soft delete (`softRemove`); TypeORM finds exclude deleted rows |

**Constraints:**
- `uq_travelers_user_id_is_self`: partial unique on `user_id` `WHERE is_self AND deleted_at IS NULL`, so a user has at most one live "self" profile.
- `idx_travelers_user_id`, `idx_travelers_phone`

> Normalize `phone` / `emergency_contact_phone` to E.164 before writing. When a user signs up with a phone that matches admin-created travelers (`user_id` null), link them in the service layer.

---

## Enums

Stored as native Postgres enum types. Values can be added later, but not removed or renamed without a migration.

| Enum | Source | Values |
|---|---|---|
| `ECountryStatus` | `schemas/countries.schema.ts` | `coming_soon`, `live` |
| `EDestinationStatus` | `schemas/destinations.schema.ts` | `coming_soon`, `live` |
| `ETripStatus` | `schemas/trips.schema.ts` | `draft`, `live` |
| `ETripDepartureStatus` | `schemas/trip_departures.schema.ts` | `draft`, `open`, `cancelled`, `completed` |
| `ETripTier` | `schemas/trips.schema.ts` | `budget`, `standard`, `premium` |
| `ETripAudience` | `schemas/trips.schema.ts` | `open`, `couples` |
| `ETripDeparturePriceType` | `schemas/trip_departure_prices.schema.ts` | `adult`, `child` |
| `ECURRENCY` | `schemas/misc.schema.ts` | `inr`, `usd`, `cad`, `aed` |
| `EBookingRequestStatus` | `schemas/booking_requests.schema.ts` | `new`, `contacted`, `in_progress`, `converted`, `closed` |
| `EUserRole` | `schemas/users.schema.ts` | `customer`, `admin`, `guide` |
| `EAuthIdentityProvider` | `schemas/auth_identities.schema.ts` | `email`, `phone`, `google` |
| `ETravelerGender` | `schemas/travelers.schema.ts` | `male`, `female`, `other` |

## JSONB shapes

Shapes are defined as Zod schemas, so validate with them before writing. The database does not enforce them.

**`TAsset`** (`schemas/misc.schema.ts`)
```ts
{
  label: string | null;        // default null; caption / alt text
  description: string | null;
  type: 'image' | 'video';
  url: string;                 // URL
  thumbnail_url: string | null;
  sort_order: number;          // int >= 0, default 0
}
```

**`TItinerary`** (`schemas/trips.schema.ts`)
```ts
{
  days: {
    day: number;               // int > 0
    title: string;
    overview: string | null;
    location: string | null;
    activities: {
      title: string;
      description: string | null;
      start_time: string | null;
      end_time: string | null;
      location: string | null;
      type: 'sightseeing' | 'activity' | 'meal' | 'transfer' | 'accommodation' | 'free_time' | 'other';
      included: boolean;       // default true
    }[];
    meals: ('breakfast' | 'lunch' | 'dinner')[];
    accommodation: string | null;
  }[];
}
```

**`TTripInclusion`** (`schemas/trips.schema.ts`)
```ts
{ title: string; description: string; }
```

## Schema sync

There are no migrations yet. The schema is applied with `synchronize: true` only when `ENV=local` (see `src/configs/db.config.ts`).
- Adding a check constraint fails if existing rows violate it.
- Column renames or type changes can make TypeORM drop and recreate the column, which loses that column's data.
- Before deploying anywhere non-local, generate migrations from these entities.
