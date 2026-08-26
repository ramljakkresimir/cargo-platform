import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessaging1787750597316 implements MigrationInterface {
  name = 'AddMessaging1787750597316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userAId" uuid NOT NULL, "userBId" uuid NOT NULL, "cargoPostId" uuid, "vehiclePostId" uuid, "lastMessageAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5ec3502739d8013a8afc4525cb7" UNIQUE ("userAId", "userBId"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b9a6965f56e4f85fb13157d88" ON "conversations"  ("userAId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa4bcad772be3989d9320d9f7c" ON "conversations"  ("userBId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "senderId" uuid NOT NULL, "content" text NOT NULL, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "messages"  ("conversationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_1b9a6965f56e4f85fb13157d88f" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_fa4bcad772be3989d9320d9f7cb" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_c7b242a78556989725907ec2a69" FOREIGN KEY ("cargoPostId") REFERENCES "cargo_posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_fbe5da2cb156e76658114a36ba3" FOREIGN KEY ("vehiclePostId") REFERENCES "vehicle_posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_fbe5da2cb156e76658114a36ba3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_c7b242a78556989725907ec2a69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_fa4bcad772be3989d9320d9f7cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_1b9a6965f56e4f85fb13157d88f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5663ce0c730b2de83445e2fd1"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa4bcad772be3989d9320d9f7c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b9a6965f56e4f85fb13157d88"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
  }
}
