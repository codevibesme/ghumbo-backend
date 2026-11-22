import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillingChanges1795298409599 implements MigrationInterface {
  name = 'BillingChanges1795298409599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_refund_status_enum" AS ENUM('pending', 'processed', 'failed')
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "refund_status" "public"."bookings_refund_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "refund_amount" numeric(12, 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "payment_refund_id" character varying(40)
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "refund_reason" text
        `);
    // 'reserved' is being removed; fold existing rows into 'pending' so the
    // sweeper expires them and releases their seats.
    await queryRunner.query(`
            UPDATE "bookings" SET "status" = 'pending' WHERE "status" = 'reserved'
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    // Partial index predicate references the enum type; it must be dropped
    // before the type swap and recreated after.
    await queryRunner.query(`
            DROP INDEX "public"."uq_bookings_departure_id_user_id"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum"
            RENAME TO "bookings_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'expired')
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
            WHERE status IN ('pending')
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
            CREATE TYPE "public"."bookings_status_enum_old" AS ENUM('reserved', 'pending', 'confirmed', 'expired')
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
            WHERE status IN ('pending', 'reserved')
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "refund_reason"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "payment_refund_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "refund_amount"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "refund_status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_refund_status_enum"
        `);
  }
}
