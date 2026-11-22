import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingChanges1795023042889 implements MigrationInterface {
  name = 'BookingChanges1795023042889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_request_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_travelers_user_id_is_self"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "chk_bookings_balance_due"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "REL_1059fbd660c42c0bb119c177ac"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "request_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "balance_due"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "due_date"
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers" DROP COLUMN "is_self"
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers" DROP COLUMN "full_name"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "payment_checkout_id" character varying(40)
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "payment_reference_id" character varying(40)
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "error" text
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers"
            ADD "first_name" character varying(50) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers"
            ADD "last_name" character varying(50) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_departure_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "departure_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum"
            RENAME TO "bookings_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum" AS ENUM(
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
            CREATE UNIQUE INDEX "uq_bookings_departure_id_user_id" ON "bookings" ("departure_id", "user_id")
            WHERE status IN ('pending')
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" ("departure_id", "status")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_departure_id" FOREIGN KEY ("departure_id") REFERENCES "trip_departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "fk_bookings_departure_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_bookings_departure_id_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_bookings_departure_id_user_id"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."bookings_status_enum_old" AS ENUM(
                'pending_payment',
                'balance_due',
                'fully_paid',
                'overdue',
                'cancelled'
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
            SET DEFAULT 'pending_payment'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."bookings_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."bookings_status_enum_old"
            RENAME TO "bookings_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "departure_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_bookings_departure_id_status" ON "bookings" USING btree ("departure_id", "status")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_departure_id" FOREIGN KEY ("departure_id") REFERENCES "trip_departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers" DROP COLUMN "last_name"
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers" DROP COLUMN "first_name"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "error"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "payment_reference_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "payment_checkout_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers"
            ADD "full_name" character varying(100) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "travelers"
            ADD "is_self" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "due_date" TIMESTAMP WITH TIME ZONE NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "balance_due" numeric(12, 2) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "request_id" character varying(26)
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "REL_1059fbd660c42c0bb119c177ac" UNIQUE ("request_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "chk_bookings_balance_due" CHECK (
                    (
                        (balance_due >= (0)::numeric)
                        AND (balance_due <= amount)
                    )
                )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_travelers_user_id_is_self" ON "travelers" USING btree ("user_id")
            WHERE (
                    (is_self = true)
                    AND (deleted_at IS NULL)
                )
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "fk_bookings_request_id" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }
}
