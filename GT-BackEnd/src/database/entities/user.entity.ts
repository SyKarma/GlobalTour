import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SearchHistory } from './search-history.entity';
import { UserPreference } from './user-preference.entity';
import { WishlistItem } from './wishlist-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'google_id', type: 'varchar', length: 255, unique: true })
  googleId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName: string;

  @Column({
    name: 'avatar_url',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  avatarUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @OneToOne(() => UserPreference, (preferences) => preferences.user, {
    cascade: true,
  })
  preferences: UserPreference;

  @OneToMany(() => WishlistItem, (item) => item.user)
  wishlistItems: WishlistItem[];

  @OneToMany(() => SearchHistory, (entry) => entry.user)
  searchHistory: SearchHistory[];
}
