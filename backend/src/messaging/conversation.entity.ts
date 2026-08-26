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

// One thread per pair of users, regardless of which listing started it or how many
// listings they later message each other about. userAId/userBId are always stored in
// sorted order (userAId < userBId) so a pair can never accidentally get two rows —
// enforced by the unique constraint below and ConversationsService's canonical-order
// find-or-create (same pattern as CityDistanceService's cityAId/cityBId).
@Entity('conversations')
@Unique(['userAId', 'userBId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userAId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userAId' })
  userA: User;

  @Index()
  @Column('uuid')
  userBId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userBId' })
  userB: User;

  // Which listing this conversation was originally started from — display context only.
  // Nullable and ON DELETE SET NULL: deleting the listing later must never break an
  // already-existing conversation between the two users.
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

  // Denormalized for cheap "order conversations by recent activity" without joining
  // messages; updated by ConversationsService.sendMessage() alongside the insert.
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
