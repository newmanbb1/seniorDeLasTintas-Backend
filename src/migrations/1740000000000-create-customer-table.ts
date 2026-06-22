import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerTable1740000000000 implements MigrationInterface {
  name = 'CreateCustomerTable1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" uuid,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        "name" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "nit" character varying(50),
        CONSTRAINT "PK_customer_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_customer_phone" ON "customer" ("phone") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_customer_nit" ON "customer" ("nit") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_deleted_at" ON "customer" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_created_by" ON "customer" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_updated_by" ON "customer" ("updated_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_deleted_by" ON "customer" ("deleted_by")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_customer_deleted_by"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_updated_by"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_nit"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_phone"`);
    await queryRunner.query(`DROP TABLE "customer"`);
  }
}
