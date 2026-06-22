import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerIdToOrder1740000000001 implements MigrationInterface {
  name = 'AddCustomerIdToOrder1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" ADD "customer_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_customer_id" ON "order" ("customer_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "order"
      ADD CONSTRAINT "FK_order_customer"
      FOREIGN KEY ("customer_id")
      REFERENCES "customer"("id")
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_order_customer"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_order_customer_id"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customer_id"`);
  }
}
