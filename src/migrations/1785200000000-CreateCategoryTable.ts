import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1785200000000 implements MigrationInterface {
  name = 'CreateCategoryTable1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "category" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" uuid,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        "name" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(100) NOT NULL DEFAULT 'default',
        "color" character varying(50) NOT NULL DEFAULT 'blue',
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_category_name" UNIQUE ("name"),
        CONSTRAINT "PK_category_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "category";`);
  }
}
