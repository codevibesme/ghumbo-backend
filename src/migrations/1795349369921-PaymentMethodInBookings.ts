import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentMethodInBookings1795349369921 implements MigrationInterface {
  name = 'PaymentMethodInBookings1795349369921';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "payment_method" text
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "payment_method"
        `);
  }
}
