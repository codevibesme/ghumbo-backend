import { MigrationInterface, QueryRunner } from 'typeorm';

export class CancelBookingFlow1795375919739 implements MigrationInterface {
  name = 'CancelBookingFlow1795375919739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "refunded_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancelled_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancellation_reason" text
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancellation_fee" numeric(12, 2)
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum"
            ADD VALUE 'cancelled'
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" ("departure_id", "status")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    // 'cancelled' has no equivalent in the old enum; 'expired' is the closest
    // terminal status. Cancellation details stay in their columns until dropped below.
    await queryRunner.query(`
            UPDATE "bookings" SET "status" = 'expired' WHERE "status" = 'cancelled'
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum_old" AS ENUM('pending', 'confirmed', 'expired')
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
            ALTER TABLE "bookings" DROP COLUMN "cancellation_fee"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "cancellation_reason"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "cancelled_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "refunded_at"
        `);
  }
}
