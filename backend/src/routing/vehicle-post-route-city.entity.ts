import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { City } from '../cities/city.entity';

@Entity('vehicle_post_route_cities')
@Unique(['vehiclePostId', 'cityId'])
@Index(['vehiclePostId', 'orderIndex'])
@Index(['cityId'])
export class VehiclePostRouteCity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vehiclePostId: string;

  // String-based reference avoids circular import with VehiclePost entity
  @ManyToOne('VehiclePost', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiclePostId' })
  vehiclePost: any;

  @Column({ type: 'uuid' })
  cityId: string;

  @ManyToOne(() => City, { nullable: false, eager: false })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'float', default: 0 })
  distanceFromStartKm: number;

  @Column({ type: 'float', default: 0 })
  distanceFromRouteKm: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
