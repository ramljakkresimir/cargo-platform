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

@Entity('vehicle_posts')
export class VehiclePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.vehiclePosts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  // City relations — nullable so old posts without city IDs still load fine
  @Column({ type: 'uuid', nullable: true })
  originCityId: string | null;

  @ManyToOne(() => City, { nullable: true, eager: false })
  @JoinColumn({ name: 'originCityId' })
  originCity: City | null;

  @Column({ type: 'uuid', nullable: true })
  destinationCityId: string | null;

  @ManyToOne(() => City, { nullable: true, eager: false })
  @JoinColumn({ name: 'destinationCityId' })
  destinationCity: City | null;

  // Legacy free-text fields — kept nullable for backward compatibility
  @Column({ nullable: true })
  availableLocation: string;

  @Column({ nullable: true })
  destinationPreference: string;

  @Column({ type: 'date' })
  availableFromDate: string;

  @Column()
  vehicleType: string;

  @Column({ type: 'float', nullable: true })
  capacity: number;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ type: 'varchar', default: PostStatus.ACTIVE })
  status: PostStatus;

  // Driving route geometry from OpenRouteService — stored as [{lat, lng}] array.
  // Null when ORS is unavailable or when the post has no destination city.
  @Column({ type: 'jsonb', nullable: true })
  routeGeoJson: { lat: number; lng: number }[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
