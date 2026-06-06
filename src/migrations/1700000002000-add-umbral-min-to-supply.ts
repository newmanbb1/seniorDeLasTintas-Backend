import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUmbralMinToSupply1700000002000 implements MigrationInterface {
  name = 'AddUmbralMinToSupply1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supply" ADD "umbral_min" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supply" DROP COLUMN "umbral_min"`);
  }
}
