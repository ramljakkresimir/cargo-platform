import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { PostStatus } from '../common/enums/post-status.enum';

@Entity('cargo_posts')
export class CargoPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Explicit FK column — lets us read companyId without loading the full Company object
  @Column({ type: 'uuid' })
  companyId: string;

  // @JoinColumn maps this relation to the companyId column above
  @ManyToOne(() => Company, (company) => company.cargoPosts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  loadingLocation: string;

  @Column()
  unloadingLocation: string;

  // Store as a date string (YYYY-MM-DD); PostgreSQL date type is fine here
  @Column({ type: 'date' })
  loadingDate: string;

  @Column({ nullable: true })
  cargoType: string;

  // Using float so TypeORM returns a JS number, not a string
  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  requiredVehicleType: string;

  @Column({ type: 'float', nullable: true })
  price: number;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ type: 'varchar', default: PostStatus.ACTIVE })
  status: PostStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
