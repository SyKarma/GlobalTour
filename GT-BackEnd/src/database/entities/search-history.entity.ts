import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SearchType } from '../enums';
import { User } from './user.entity';

@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.searchHistory, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({
    name: 'search_type',
    type: 'enum',
    enum: SearchType,
  })
  searchType: SearchType;

  @Column({ name: 'origin_iata', type: 'char', length: 3, nullable: true })
  originIata: string | null;

  @Column({
    name: 'destination_iata',
    type: 'char',
    length: 3,
    nullable: true,
  })
  destinationIata: string | null;

  @Column({ name: 'travel_month', type: 'char', length: 7, nullable: true })
  travelMonth: string | null;

  @Column({ name: 'query_json', type: 'json' })
  queryJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
