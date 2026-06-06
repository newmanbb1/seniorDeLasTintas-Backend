import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeWhatsappMessageCreatedByNullable1700000001000 implements MigrationInterface {
  name = 'MakeWhatsappMessageCreatedByNullable1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_message" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_message" ALTER COLUMN "created_by" SET NOT NULL`,
    );
  }
}
