import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CargoPost } from '../cargo-posts/cargo-post.entity';
import { VehiclePost } from '../vehicle-posts/vehicle-post.entity';

// One rating per (rater, ratedUser) pair — rating the same person again updates this
// row rather than creating a new one (enforced by the unique constraint below and
// RatingsService.submitOrUpdate()'s find-or-create). Unlike Conversation's canonical
// sorted pair, direction matters here (A rating B is not the same fact as B rating A),
// so raterId/ratedUserId are not sorted.
@Entity('ratings')
@Unique(['raterId', 'ratedUserId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  raterId: string;

  // CASCADE (unlike Conversation's userAId/userBId, which are deliberately NO ACTION):
  // deleting a user only ever needs to remove ratings where that user is the rater or
  // the rated user — nothing here can transitively affect a third user's data the way a
  // stray cascade through a shared conversation row could, so a plain CASCADE is safe.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raterId' })
  rater: User;

  @Index()
  @Column('uuid')
  ratedUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ratedUserId' })
  ratedUser: User;

  @Column({ type: 'smallint' })
  score: number;

  // Which listing prompted this rating — display context only, exactly like
  // Conversation.cargoPostId/vehiclePostId. Nullable + SET NULL: deleting the listing
  // later must never delete or break an already-submitted rating.
  @Column({ type: 'uuid', nullable: true })
  cargoPostId: string | null;

  @ManyToOne(() => CargoPost, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cargoPostId' })
  cargoPost: CargoPost | null;

  @Column({ type: 'uuid', nullable: true })
  vehiclePostId: string | null;

  @ManyToOne(() => VehiclePost, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehiclePostId' })
  vehiclePost: VehiclePost | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
