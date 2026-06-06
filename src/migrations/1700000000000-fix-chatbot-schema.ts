import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixChatbotSchema1700000000000 implements MigrationInterface {
  name = 'FixChatbotSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_session" ADD "last_message" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_session" ADD "last_message_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_session" ADD "unread_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_session" ADD "is_archived" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."whatsapp_message_message_type_enum" AS ENUM('text', 'image', 'document', 'audio', 'video', 'button', 'list', 'unknown')`,
    );

    await queryRunner.query(
      `CREATE TABLE "whatsapp_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "phone_number" character varying(20) NOT NULL, "from_me" boolean NOT NULL, "message_type" "public"."whatsapp_message_message_type_enum" NOT NULL DEFAULT 'text', "content" text, "media_url" character varying, "wa_message_id" character varying, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_whatsapp_message_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_message_phone" ON "whatsapp_message" ("phone_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_message_timestamp" ON "whatsapp_message" ("timestamp")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_message_wa_id" ON "whatsapp_message" ("wa_message_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_whatsapp_message_wa_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_whatsapp_message_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_whatsapp_message_phone"`);
    await queryRunner.query(`DROP TABLE "whatsapp_message"`);
    await queryRunner.query(`DROP TYPE "public"."whatsapp_message_message_type_enum"`);
    await queryRunner.query(`ALTER TABLE "whatsapp_session" DROP COLUMN "is_archived"`);
    await queryRunner.query(`ALTER TABLE "whatsapp_session" DROP COLUMN "unread_count"`);
    await queryRunner.query(`ALTER TABLE "whatsapp_session" DROP COLUMN "last_message_at"`);
    await queryRunner.query(`ALTER TABLE "whatsapp_session" DROP COLUMN "last_message"`);
  }
}
