import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

// Cached road-distance lookups between city pairs, keyed by a canonical (sorted)
// pair of city ids so (A,B) and (B,A) always resolve to the same cached row.
@Entity('city_distances')
@Unique(['cityAId', 'cityBId'])
export class CityDistance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  cityAId: string;

  @Index()
  @Column('uuid')
  cityBId: string;

  @Column('float')
  distanceKm: number;

  @CreateDateColumn()
  createdAt: Date;
}
