import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCargoPostRouteGeoJson1787900000000 implements MigrationInterface {
  name = 'AddCargoPostRouteGeoJson1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" ADD "routeGeoJson" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo_posts" DROP COLUMN "routeGeoJson"`,
    );
  }
}
