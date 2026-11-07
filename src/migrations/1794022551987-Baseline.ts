import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema, generated from the entities against an empty database, plus the
 * extensions and trigram indexes TypeORM does not generate.
 */
export class Baseline1794022551987 implements MigrationInterface {
  name = 'Baseline1794022551987';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // citext: users.email, travelers.email. pg_trgm: the trigram search indexes below.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`
            CREATE TABLE "auth_sessions" (
                "id" character varying(26) NOT NULL,
                "user_id" character varying(26) NOT NULL,
                "refresh_token_hash" character(64) NOT NULL,
                "user_agent" text NOT NULL,
                "ip_address" inet NOT NULL,
                "device_id" character varying(255) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_8ae45196f82be4540770b41ac50" UNIQUE ("refresh_token_hash"),
                CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."auth_identities_provider_enum" AS ENUM('email', 'phone', 'google')
        `);
    await queryRunner.query(`
            CREATE TABLE "auth_identities" (
                "id" character varying(26) NOT NULL,
                "user_id" character varying(26) NOT NULL,
                "provider" "public"."auth_identities_provider_enum" NOT NULL,
                "provider_user_id" character varying(255) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_auth_identities_provider_provider_user_id" UNIQUE ("provider", "provider_user_id"),
                CONSTRAINT "uq_auth_identities_user_id_provider" UNIQUE ("user_id", "provider"),
                CONSTRAINT "PK_63a29aebcddd09448dbeee4666b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "trip_reviews" (
                "id" character varying(26) NOT NULL,
                "user_id" character varying(26),
                "trip_id" character varying(26) NOT NULL,
                "rating" integer NOT NULL,
                "feedback" text,
                "assets" jsonb NOT NULL DEFAULT '[]',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_trip_reviews_user_id_trip_id" UNIQUE ("user_id", "trip_id"),
                CONSTRAINT "chk_trip_reviews_rating" CHECK (
                    "rating" BETWEEN 1 AND 5
                ),
                CONSTRAINT "PK_d37ebb3679ea84ba7756945083a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_trip_reviews_trip_id" ON "trip_reviews" ("trip_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_payments_type_enum" AS ENUM('refund', 'credit')
        `);
    await queryRunner.query(`
            CREATE TABLE "booking_payments" (
                "id" character varying(26) NOT NULL,
                "booking_id" character varying(26) NOT NULL,
                "type" "public"."booking_payments_type_enum" NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "chk_booking_payments_amount" CHECK ("amount" > 0),
                CONSTRAINT "PK_4f54ffc7dfddb70234fb53a97a9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_booking_payments_booking_id" ON "booking_payments" ("booking_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum" AS ENUM(
                'pending_payment',
                'balance_due',
                'fully_paid',
                'overdue',
                'cancelled'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_currency_enum" AS ENUM('inr', 'usd', 'cad', 'aed')
        `);
    await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" character varying(26) NOT NULL,
                "code" character varying(9) NOT NULL,
                "request_id" character varying(26),
                "user_id" character varying(26),
                "departure_id" character varying(26),
                "traveler_count" integer NOT NULL,
                "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending_payment',
                "currency" "public"."bookings_currency_enum" NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "balance_due" numeric(12, 2) NOT NULL,
                "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "cancelled_at" TIMESTAMP WITH TIME ZONE,
                "cancel_reason" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_9add00bfd42ae2bbe830bab9aa2" UNIQUE ("code"),
                CONSTRAINT "REL_1059fbd660c42c0bb119c177ac" UNIQUE ("request_id"),
                CONSTRAINT "chk_bookings_balance_due" CHECK (
                    "balance_due" >= 0
                    AND "balance_due" <= "amount"
                ),
                CONSTRAINT "chk_bookings_amount" CHECK ("amount" >= 0),
                CONSTRAINT "chk_bookings_traveler_count" CHECK ("traveler_count" > 0),
                CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_user_id" ON "bookings" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" ("departure_id", "status")
        `);
    await queryRunner.query(`
            CREATE TABLE "booking_travelers" (
                "booking_id" character varying(26) NOT NULL,
                "traveler_id" character varying(26) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0862b9f3706f329648de7414a73" PRIMARY KEY ("booking_id", "traveler_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_booking_travelers_traveler_id" ON "booking_travelers" ("traveler_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."travelers_gender_enum" AS ENUM('male', 'female', 'other')
        `);
    await queryRunner.query(`
            CREATE TABLE "travelers" (
                "id" character varying(26) NOT NULL,
                "user_id" character varying(26),
                "is_self" boolean NOT NULL DEFAULT false,
                "full_name" character varying(100) NOT NULL,
                "date_of_birth" date NOT NULL,
                "gender" "public"."travelers_gender_enum" NOT NULL,
                "phone" character varying(16),
                "email" citext,
                "emergency_contact_name" character varying(100),
                "emergency_contact_phone" character varying(16),
                "dietary_notes" text,
                "medical_notes" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_bd53abb73a857c61faa9d541c42" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_travelers_user_id" ON "travelers" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_travelers_phone" ON "travelers" ("phone")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_travelers_user_id_is_self" ON "travelers" ("user_id")
            WHERE "is_self" = true
                AND "deleted_at" IS NULL
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'admin', 'guide')
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" character varying(26) NOT NULL,
                "first_name" character varying(50) NOT NULL,
                "last_name" character varying(50) NOT NULL,
                "email" citext,
                "phone" character varying(16),
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer',
                "photo" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_requests_status_enum" AS ENUM(
                'new',
                'contacted',
                'in_progress',
                'converted',
                'closed',
                'withdrawn'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "booking_requests" (
                "id" character varying(26) NOT NULL,
                "trip_departure_id" character varying(26) NOT NULL,
                "user_id" character varying(26),
                "code" character varying(9) NOT NULL,
                "first_name" character varying(50) NOT NULL,
                "last_name" character varying(50) NOT NULL,
                "email" character varying(254) NOT NULL,
                "phone" character varying(16) NOT NULL,
                "traveler_count" integer NOT NULL,
                "query" text,
                "status" "public"."booking_requests_status_enum" NOT NULL DEFAULT 'new',
                "status_notes" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_0b1a4256b63fe047f369e1b466c" UNIQUE ("code"),
                CONSTRAINT "chk_booking_requests_traveler_count" CHECK ("traveler_count" > 0),
                CONSTRAINT "PK_62c29ee249979fe0bcdcde33dae" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_booking_requests_trip_departure_id" ON "booking_requests" ("trip_departure_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_booking_requests_user_id" ON "booking_requests" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_booking_requests_user_id_trip_departure_id" ON "booking_requests" ("user_id", "trip_departure_id")
            WHERE status NOT IN ('withdrawn', 'closed')
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_booking_requests_email_trip_departure_id" ON "booking_requests" ("email", "trip_departure_id")
            WHERE status NOT IN ('withdrawn', 'closed')
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_booking_requests_status_created_at" ON "booking_requests" ("status", "created_at")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."trip_departures_status_enum" AS ENUM('draft', 'open', 'cancelled', 'completed')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."trip_departures_currency_enum" AS ENUM('inr', 'usd', 'cad', 'aed')
        `);
    await queryRunner.query(`
            CREATE TABLE "trip_departures" (
                "id" character varying(26) NOT NULL,
                "trip_id" character varying(26) NOT NULL,
                "status" "public"."trip_departures_status_enum" NOT NULL DEFAULT 'draft',
                "is_peak" boolean NOT NULL DEFAULT false,
                "start_date" date NOT NULL,
                "end_date" date NOT NULL,
                "capacity" integer NOT NULL,
                "booked_seats" integer NOT NULL DEFAULT '0',
                "currency" "public"."trip_departures_currency_enum" NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "chk_trip_departures_dates" CHECK ("end_date" >= "start_date"),
                CONSTRAINT "chk_trip_departures_booked_seats" CHECK (
                    "booked_seats" >= 0
                    AND "booked_seats" <= "capacity"
                ),
                CONSTRAINT "chk_trip_departures_capacity" CHECK ("capacity" > 0),
                CONSTRAINT "PK_a5b641bfa505c82d7f62ec47693" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_trip_departures_trip_id" ON "trip_departures" ("trip_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."trips_status_enum" AS ENUM('draft', 'live')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."trips_tier_enum" AS ENUM('budget', 'standard', 'premium')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."trips_audience_enum" AS ENUM('open', 'couples')
        `);
    await queryRunner.query(`
            CREATE TABLE "trips" (
                "id" character varying(26) NOT NULL,
                "destination_id" integer NOT NULL,
                "status" "public"."trips_status_enum" NOT NULL DEFAULT 'draft',
                "name" character varying(255) NOT NULL,
                "slug" character varying(255) NOT NULL,
                "overview" text NOT NULL,
                "tier" "public"."trips_tier_enum" NOT NULL,
                "audience" "public"."trips_audience_enum" NOT NULL DEFAULT 'open',
                "duration_days" integer NOT NULL,
                "duration_nights" integer NOT NULL,
                "tags" jsonb NOT NULL DEFAULT '[]',
                "itinerary" jsonb NOT NULL,
                "inclusions" jsonb NOT NULL DEFAULT '[]',
                "exclusions" jsonb NOT NULL DEFAULT '[]',
                "assets" jsonb NOT NULL DEFAULT '[]',
                "is_recommended" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_trips_slug" UNIQUE ("slug"),
                CONSTRAINT "chk_trips_duration" CHECK (
                    "duration_days" > 0
                    AND "duration_nights" >= 0
                    AND "duration_nights" <= "duration_days"
                ),
                CONSTRAINT "chk_trips_slug" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
                CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_trips_destination_id" ON "trips" ("destination_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."destinations_status_enum" AS ENUM('coming_soon', 'live')
        `);
    await queryRunner.query(`
            CREATE TABLE "destinations" (
                "id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
                "country_id" integer NOT NULL,
                "status" "public"."destinations_status_enum" NOT NULL DEFAULT 'coming_soon',
                "name" character varying(255) NOT NULL,
                "slug" character varying(255) NOT NULL,
                "overview" text NOT NULL,
                "latitude" double precision NOT NULL,
                "longitude" double precision NOT NULL,
                "assets" jsonb NOT NULL DEFAULT '[]',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_destinations_slug" UNIQUE ("slug"),
                CONSTRAINT "chk_destinations_longitude" CHECK (
                    "longitude" BETWEEN -180 AND 180
                ),
                CONSTRAINT "chk_destinations_latitude" CHECK (
                    "latitude" BETWEEN -90 AND 90
                ),
                CONSTRAINT "chk_destinations_slug" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
                CONSTRAINT "PK_69c5e8db964dcb83d3a0640f3c7" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_destinations_country_id" ON "destinations" ("country_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."countries_status_enum" AS ENUM('coming_soon', 'live')
        `);
    await queryRunner.query(`
            CREATE TABLE "countries" (
                "id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
                "status" "public"."countries_status_enum" NOT NULL DEFAULT 'coming_soon',
                "name" character varying(255) NOT NULL,
                "code" character(2) NOT NULL,
                "latitude" double precision NOT NULL,
                "longitude" double precision NOT NULL,
                "assets" jsonb NOT NULL DEFAULT '[]',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"),
                CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE ("code"),
                CONSTRAINT "chk_countries_longitude" CHECK (
                    "longitude" BETWEEN -180 AND 180
                ),
                CONSTRAINT "chk_countries_latitude" CHECK (
                    "latitude" BETWEEN -90 AND 90
                ),
                CONSTRAINT "chk_countries_code_upper" CHECK ("code" = upper("code")),
                CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions"
            ADD CONSTRAINT "fk_auth_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_identities"
            ADD CONSTRAINT "fk_auth_identities_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_reviews"
            ADD CONSTRAINT "fk_trip_reviews_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_reviews"
            ADD CONSTRAINT "fk_trip_reviews_trip_id" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_payments"
            ADD CONSTRAINT "fk_booking_payments_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_request_id" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_departure_id" FOREIGN KEY ("departure_id") REFERENCES "trip_departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_travelers"
            ADD CONSTRAINT "fk_booking_travelers_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_travelers"
            ADD CONSTRAINT "fk_booking_travelers_traveler_id" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers"
            ADD CONSTRAINT "fk_travelers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_requests"
            ADD CONSTRAINT "fk_booking_requests_trip_departure_id" FOREIGN KEY ("trip_departure_id") REFERENCES "trip_departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_requests"
            ADD CONSTRAINT "fk_booking_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_departures"
            ADD CONSTRAINT "fk_trip_departures_trip_id" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD CONSTRAINT "fk_trips_destination_id" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "destinations"
            ADD CONSTRAINT "fk_destinations_country_id" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

    // Trigram indexes for the ILIKE '%…%' searches in trips.repository.ts and
    // destinations.repository.ts. Declared with `synchronize: false` on the entities,
    // so TypeORM never generates them; they are maintained here by hand.
    await queryRunner.query(`
            CREATE INDEX "idx_trips_name_trgm" ON "trips" USING gin ("name" gin_trgm_ops)
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_trips_overview_trgm" ON "trips" USING gin ("overview" gin_trgm_ops)
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_trips_tags_trgm" ON "trips" USING gin (("tags"::text) gin_trgm_ops)
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_destinations_name_trgm" ON "destinations" USING gin ("name" gin_trgm_ops)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_destinations_name_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trips_tags_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trips_overview_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trips_name_trgm"`);
    await queryRunner.query(`
            ALTER TABLE "destinations" DROP CONSTRAINT "fk_destinations_country_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP CONSTRAINT "fk_trips_destination_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_departures" DROP CONSTRAINT "fk_trip_departures_trip_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_requests" DROP CONSTRAINT "fk_booking_requests_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_requests" DROP CONSTRAINT "fk_booking_requests_trip_departure_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers" DROP CONSTRAINT "fk_travelers_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_travelers" DROP CONSTRAINT "fk_booking_travelers_traveler_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_travelers" DROP CONSTRAINT "fk_booking_travelers_booking_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_departure_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_request_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_payments" DROP CONSTRAINT "fk_booking_payments_booking_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_reviews" DROP CONSTRAINT "fk_trip_reviews_trip_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "trip_reviews" DROP CONSTRAINT "fk_trip_reviews_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_identities" DROP CONSTRAINT "fk_auth_identities_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions" DROP CONSTRAINT "fk_auth_sessions_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "countries"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."countries_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_destinations_country_id"
        `);
    await queryRunner.query(`
            DROP TABLE "destinations"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."destinations_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_trips_destination_id"
        `);
    await queryRunner.query(`
            DROP TABLE "trips"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."trips_audience_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."trips_tier_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."trips_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_trip_departures_trip_id"
        `);
    await queryRunner.query(`
            DROP TABLE "trip_departures"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."trip_departures_currency_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."trip_departures_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_booking_requests_status_created_at"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_booking_requests_email_trip_departure_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_booking_requests_user_id_trip_departure_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_booking_requests_user_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_booking_requests_trip_departure_id"
        `);
    await queryRunner.query(`
            DROP TABLE "booking_requests"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_requests_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_travelers_user_id_is_self"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_travelers_phone"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_travelers_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "travelers"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."travelers_gender_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_booking_travelers_traveler_id"
        `);
    await queryRunner.query(`
            DROP TABLE "booking_travelers"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "bookings"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_currency_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_booking_payments_booking_id"
        `);
    await queryRunner.query(`
            DROP TABLE "booking_payments"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_payments_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_trip_reviews_trip_id"
        `);
    await queryRunner.query(`
            DROP TABLE "trip_reviews"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_identities"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."auth_identities_provider_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_auth_sessions_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_sessions"
        `);
  }
}
