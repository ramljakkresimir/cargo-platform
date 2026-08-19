import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSecurityColumns1787154161858 implements MigrationInterface {
  name = 'AddAuthSecurityColumns1787154161858';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationExpiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationLastSentAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetExpiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetLastSentAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "failedLoginAttempts" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastFailedLoginAt" TIMESTAMP`,
    );

    // Grandfather clause: every row that exists at the moment this migration runs
    // predates the email-verification requirement and already has a working login —
    // mark them verified so this migration can never lock out an existing user
    // (including existing admin accounts). Rows created after this point get
    // emailVerified = false explicitly from AuthService.register(), not from this
    // backfill (the column DEFAULT false only ever applies at ADD COLUMN time, to
    // the rows that existed then — new INSERTs are untouched by it).
    await queryRunner.query(`UPDATE "users" SET "emailVerified" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "lastFailedLoginAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "failedLoginAttempts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetLastSentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetTokenHash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationLastSentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationTokenHash"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
  }
}
