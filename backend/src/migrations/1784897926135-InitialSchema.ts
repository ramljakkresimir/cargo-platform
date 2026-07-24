import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784897926135 implements MigrationInterface {
  name = 'InitialSchema1784897926135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "country" character varying NOT NULL, "region" character varying, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4b34bea90161edd2e9cad9ff37" ON "cities"  ("name", "country") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cargo_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "loadingCityId" uuid, "unloadingCityId" uuid, "loadingLocation" character varying, "unloadingLocation" character varying, "loadingDate" date NOT NULL, "cargoType" character varying, "weight" double precision, "dimensions" character varying, "requiredVehicleType" character varying, "price" double precision, "note" text, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4bf8c93b9d4b96b3af82c55d6dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "originCityId" uuid, "destinationCityId" uuid, "availableLocation" character varying, "destinationPreference" character varying, "availableFromDate" date NOT NULL, "vehicleType" character varying NOT NULL, "capacity" double precision, "note" text, "status" character varying NOT NULL DEFAULT 'active', "routeGeoJson" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35abab42640ba70f32d7c73e15b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "companyName" character varying NOT NULL, "companyType" character varying NOT NULL, "country" character varying NOT NULL, "city" character varying NOT NULL, "address" character varying, "taxNumber" character varying, "phone" character varying, "email" character varying, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_6d64e8c7527a9e4af83cc66cbf" UNIQUE ("userId"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying, "role" character varying NOT NULL DEFAULT 'user', "passwordChangedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_post_route_cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehiclePostId" uuid NOT NULL, "cityId" uuid NOT NULL, "orderIndex" integer NOT NULL, "distanceFromStartKm" double precision NOT NULL DEFAULT '0', "distanceFromRouteKm" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0edaf48b18ec43e298d72425645" UNIQUE ("vehiclePostId", "cityId"), CONSTRAINT "PK_01db5165a946c72850918d31da6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bd673314729efe8a24f7ccf77" ON "vehicle_post_route_cities"  ("cityId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fcaaee975848ca13de44f0e763" ON "vehicle_post_route_cities"  ("vehiclePostId", "orderIndex") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" ADD CONSTRAINT "FK_31239a74579191b0caed426b72b" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" ADD CONSTRAINT "FK_1f8a95e3864d1b9aa75493812af" FOREIGN KEY ("loadingCityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" ADD CONSTRAINT "FK_88ad74897850cf04e02ff017b07" FOREIGN KEY ("unloadingCityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" ADD CONSTRAINT "FK_0fba1b968d65baf876314e8669e" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" ADD CONSTRAINT "FK_82e16b016fa6eec8a2bd28e3921" FOREIGN KEY ("originCityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" ADD CONSTRAINT "FK_58971a3956569a5e3d380d908bc" FOREIGN KEY ("destinationCityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_post_route_cities" ADD CONSTRAINT "FK_255f3fd9398dafa2f221cfc3481" FOREIGN KEY ("vehiclePostId") REFERENCES "vehicle_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_post_route_cities" ADD CONSTRAINT "FK_5bd673314729efe8a24f7ccf779" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_post_route_cities" DROP CONSTRAINT "FK_5bd673314729efe8a24f7ccf779"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_post_route_cities" DROP CONSTRAINT "FK_255f3fd9398dafa2f221cfc3481"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_6d64e8c7527a9e4af83cc66cbf7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" DROP CONSTRAINT "FK_58971a3956569a5e3d380d908bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" DROP CONSTRAINT "FK_82e16b016fa6eec8a2bd28e3921"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_posts" DROP CONSTRAINT "FK_0fba1b968d65baf876314e8669e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" DROP CONSTRAINT "FK_88ad74897850cf04e02ff017b07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" DROP CONSTRAINT "FK_1f8a95e3864d1b9aa75493812af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" DROP CONSTRAINT "FK_31239a74579191b0caed426b72b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fcaaee975848ca13de44f0e763"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5bd673314729efe8a24f7ccf77"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_post_route_cities"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "vehicle_posts"`);
    await queryRunner.query(`DROP TABLE "cargo_posts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b34bea90161edd2e9cad9ff37"`,
    );
    await queryRunner.query(`DROP TABLE "cities"`);
  }
}
