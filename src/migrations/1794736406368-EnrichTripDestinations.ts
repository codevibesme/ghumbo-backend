import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnrichTripDestinations1794736406368 implements MigrationInterface {
  name = 'EnrichTripDestinations1794736406368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "tagline" character varying(100) NOT NULL DEFAULT ''
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "source_hubs" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "destination_hub" jsonb NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "stops" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "best_time" character varying(10) NOT NULL DEFAULT ''
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "highlights" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "callouts" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "what_to_pack" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "meeting_instructions" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "trips"
            ADD "faq" jsonb NOT NULL DEFAULT '[]'
        `);
    await queryRunner.query(`
            ALTER TABLE "destinations"
            ADD "best_time" character varying(10) NOT NULL DEFAULT ''
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "destinations" DROP COLUMN "best_time"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "faq"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "meeting_instructions"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "what_to_pack"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "callouts"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "highlights"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "best_time"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "stops"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "destination_hub"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "source_hubs"
        `);
    await queryRunner.query(`
            ALTER TABLE "trips" DROP COLUMN "tagline"
        `);
  }
}
