import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'preferred_currency',
    type: 'char',
    length: 3,
    default: 'USD',
  })
  preferredCurrency: string;

  @Column({
    name: 'home_city_iata',
    type: 'char',
    length: 3,
    nullable: true,
  })
  homeCityIata: string | null;

  @Column({
    name: 'default_origin_iata',
    type: 'char',
    length: 3,
    nullable: true,
  })
  defaultOriginIata: string | null;
}
