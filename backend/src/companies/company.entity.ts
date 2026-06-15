import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';

export enum CompanyType {
  TRANSPORT = 'transport',
  FREIGHT_FORWARDER = 'freight_forwarder',
  MANUFACTURER = 'manufacturer',
  TRADER = 'trader',
  OTHER = 'other',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the user who owns this company profile
  @Column({ type: 'uuid' })
  userId: string;

  // @JoinColumn tells TypeORM which column holds the foreign key for this relation
  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  companyName: string;

  @Column({ type: 'varchar' })
  companyType: CompanyType;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  taxNumber: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // These are the reverse sides of the ManyToOne relations on the post entities
  @OneToMany(() => CargoPost, (post) => post.company)
  cargoPosts: CargoPost[];

  @OneToMany(() => VehiclePost, (post) => post.company)
  vehiclePosts: VehiclePost[];
}
