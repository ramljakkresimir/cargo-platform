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

@Entity('vehicle_posts')
export class VehiclePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.vehiclePosts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  availableLocation: string;

  @Column({ type: 'date' })
  availableFromDate: string;

  @Column()
  vehicleType: string;

  @Column({ type: 'float', nullable: true })
  capacity: number;

  @Column({ nullable: true })
  destinationPreference: string;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ type: 'varchar', default: PostStatus.ACTIVE })
  status: PostStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
