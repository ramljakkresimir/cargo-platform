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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // A user can have one company profile (nullable — they may not have created it yet)
  @OneToOne(() => Company, (company) => company.user, { nullable: true })
  company: Company;
}
