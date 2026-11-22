import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingEnumUpdateAndExpiresAt1795060723718 implements MigrationInterface {
  name = 'BookingEnumUpdateAndExpiresAt1795060723718';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "cancelled_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "cancel_reason"
        `);

    // expires_at: add nullable, backfill existing rows (10-minute hold), then enforce NOT NULL
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "expires_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            UPDATE "bookings"
            SET "expires_at" = "created_at" + interval '10 minutes'
            WHERE "expires_at" IS NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "expires_at" SET NOT NULL
        `);

    // Drop every index that references "status" before swapping the enum type.
    // The partial unique index's predicate is bound to the old enum type and
    // would otherwise break the ALTER COLUMN ... TYPE below.
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_bookings_departure_id_user_id"
        `);

    // Map statuses that no longer exist in the new enum
    await queryRunner.query(`
            UPDATE "bookings"
            SET "status" = 'expired'
            WHERE "status" IN ('cancelled', 'failed')
        `);

    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum"
            RENAME TO "bookings_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum" AS ENUM('reserved', 'pending', 'confirmed', 'expired')
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status" TYPE "public"."bookings_status_enum" USING "status"::"text"::"public"."bookings_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" ("departure_id", "status")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_bookings_departure_id_user_id" ON "bookings" ("departure_id", "user_id")
            WHERE status IN ('pending', 'reserved')
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_bookings_departure_id_user_id"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum_old" AS ENUM(
                'reserved',
                'pending',
                'confirmed',
                'expired',
                'cancelled',
                'failed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status" TYPE "public"."bookings_status_enum_old" USING "status"::"text"::"public"."bookings_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum_old"
            RENAME TO "bookings_status_enum"
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" USING btree ("departure_id", "status")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_bookings_departure_id_user_id" ON "bookings" ("departure_id", "user_id")
            WHERE status IN ('pending')
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "expires_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancel_reason" text
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancelled_at" TIMESTAMP WITH TIME ZONE
        `);
  }
}
