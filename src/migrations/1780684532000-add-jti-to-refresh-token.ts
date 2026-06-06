import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJtiToRefreshToken1780684532000 implements MigrationInterface {
  name = 'AddJtiToRefreshToken1780684532000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE refresh_token ADD COLUMN jti varchar NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE refresh_token DROP COLUMN jti`);
  }
}
