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
import { City } from '../cities/city.entity';
import { PostStatus } from '../common/enums/post-status.enum';

@Entity('cargo_posts')
export class CargoPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.cargoPosts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  // City relations — nullable so old posts without city IDs still load fine
  @Column({ type: 'uuid', nullable: true })
  loadingCityId: string | null;

  @ManyToOne(() => City, { nullable: true, eager: false })
  @JoinColumn({ name: 'loadingCityId' })
  loadingCity: City | null;

  @Column({ type: 'uuid', nullable: true })
  unloadingCityId: string | null;

  @ManyToOne(() => City, { nullable: true, eager: false })
  @JoinColumn({ name: 'unloadingCityId' })
  unloadingCity: City | null;

  // Legacy free-text fields — kept nullable for backward compatibility
  @Column({ nullable: true })
  loadingLocation: string;

  @Column({ nullable: true })
  unloadingLocation: string;

  @Column({ type: 'date' })
  loadingDate: string;

  @Column({ nullable: true })
  cargoType: string;

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
