import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplyIsActive1780377496 implements MigrationInterface {
  name = 'AddSupplyIsActive1780377496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supply" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supply" DROP COLUMN "is_active"`,
    );
  }
}
