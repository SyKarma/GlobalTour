import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WishlistItemType } from '../enums';
import { Destination } from './destination.entity';
import { User } from './user.entity';

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, (user) => user.wishlistItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: WishlistItemType,
  })
  itemType: WishlistItemType;

  @Column({ name: 'destination_id', type: 'varchar', length: 36, nullable: true })
  destinationId: string | null;

  @ManyToOne(() => Destination, (destination) => destination.wishlistItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destination_id' })
  destination: Destination | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({
    name: 'external_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  externalId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
