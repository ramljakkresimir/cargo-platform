import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityDistances1787668089124 implements MigrationInterface {
  name = 'AddCityDistances1787668089124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "city_distances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cityAId" uuid NOT NULL, "cityBId" uuid NOT NULL, "distanceKm" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e0ad33677189edc0d5afc83e5e5" UNIQUE ("cityAId", "cityBId"), CONSTRAINT "PK_27732645ce3190630edeb808aac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8a16c5f2620e7f97b1631e4a1" ON "city_distances"  ("cityAId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8689eedbbfbcb88406f2df3a28" ON "city_distances"  ("cityBId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8689eedbbfbcb88406f2df3a28"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8a16c5f2620e7f97b1631e4a1"`,
    );
    await queryRunner.query(`DROP TABLE "city_distances"`);
  }
}
