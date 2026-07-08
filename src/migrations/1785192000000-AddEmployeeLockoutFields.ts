import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeLockoutFields1785192000000 implements MigrationInterface {
    name = 'AddEmployeeLockoutFields1785192000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee" ADD "failed_attempts" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "employee" ADD "locked_until" TIMESTAMP NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "locked_until"`);
        await queryRunner.query(`ALTER TABLE "employee" DROP COLUMN "failed_attempts"`);
    }
}
