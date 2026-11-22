import { MigrationInterface, QueryRunner } from 'typeorm';

// The request-a-seat flow is gone (bookings + Razorpay checkout replaced it), and refunds now
// live on the booking row (refund_status, refund_amount), so booking_payments is unused too.
// Drops both tables and their enums. down() recreates them empty, as the baseline had them;
// the rows can't come back, so back them up first if you need them.
export class DropBookingRequestsAndPayments1795337909341 implements MigrationInterface {
  name = 'DropBookingRequestsAndPayments1795337909341';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DROP TABLE takes its indexes, check/unique constraints and outgoing foreign keys with it.
    await queryRunner.query(`
            DROP TABLE IF EXISTS "booking_requests"
        `);
    await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."booking_requests_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE IF EXISTS "booking_payments"
        `);
    await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."booking_payments_type_enum"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
            ALTER TABLE "booking_payments"
            ADD CONSTRAINT "fk_booking_payments_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
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
            ALTER TABLE "booking_requests"
            ADD CONSTRAINT "fk_booking_requests_trip_departure_id" FOREIGN KEY ("trip_departure_id") REFERENCES "trip_departures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_requests"
            ADD CONSTRAINT "fk_booking_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }
}
