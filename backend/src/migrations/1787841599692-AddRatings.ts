import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRatings1787841599692 implements MigrationInterface {
  name = 'AddRatings1787841599692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "raterId" uuid NOT NULL, "ratedUserId" uuid NOT NULL, "score" smallint NOT NULL, "cargoPostId" uuid, "vehiclePostId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_769ee625aa0648b68878f7e44a8" UNIQUE ("raterId", "ratedUserId"), CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5d0a61e726410a860f23f39de" ON "ratings"  ("raterId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_15f8c6bf8f35fbd9edf08f78dc" ON "ratings"  ("ratedUserId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_e5d0a61e726410a860f23f39de7" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_15f8c6bf8f35fbd9edf08f78dcd" FOREIGN KEY ("ratedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_49959d48f5fc086cfa2d099c561" FOREIGN KEY ("cargoPostId") REFERENCES "cargo_posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_4a96ed72cfd47c09901f455588d" FOREIGN KEY ("vehiclePostId") REFERENCES "vehicle_posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_4a96ed72cfd47c09901f455588d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_49959d48f5fc086cfa2d099c561"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_15f8c6bf8f35fbd9edf08f78dcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_e5d0a61e726410a860f23f39de7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_15f8c6bf8f35fbd9edf08f78dc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5d0a61e726410a860f23f39de"`,
    );
    await queryRunner.query(`DROP TABLE "ratings"`);
  }
}
