import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Company } from '../companies/company.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // @Exclude() tells class-transformer to never include this in API responses
  @Exclude()
  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'varchar', default: UserRole.USER })
  role: UserRole;

  // Tokens issued before this timestamp are rejected by JwtStrategy — lets a password
  // change invalidate any stolen/leaked token still within its 7-day expiry.
  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date | null;

  // Login is blocked until this is true — see AuthService.login(). Existing accounts
  // are backfilled to true by the migration that introduces this column.
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // SHA-256 hash of the single active verification token — never store the raw token.
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailVerificationTokenHash: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiresAt: Date | null;

  // Drives the resend cooldown — see AuthService.resendVerification().
  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  emailVerificationLastSentAt: Date | null;

  // SHA-256 hash of the single active password-reset token — never store the raw token.
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  passwordResetTokenHash: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date | null;

  // Drives the forgot-password resend cooldown.
  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  passwordResetLastSentAt: Date | null;

  // Consecutive failed login attempts since the last success — drives the
  // captcha-after-repeated-failures escalation in AuthService.login(). Reset to 0
  // on every successful login or password reset. Never used for lockout.
  @Exclude()
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  lastFailedLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // A user can have one company profile (nullable — they may not have created it yet)
  @OneToOne(() => Company, (company) => company.user, { nullable: true })
  company: Company;
}
