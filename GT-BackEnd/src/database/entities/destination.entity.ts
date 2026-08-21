import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WishlistItem } from './wishlist-item.entity';

@Entity('destinations')
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'city_name', type: 'varchar', length: 255 })
  cityName: string;

  @Column({ name: 'country_name', type: 'varchar', length: 255 })
  countryName: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode: string;

  @Column({ name: 'city_iata', type: 'char', length: 3, unique: true })
  cityIata: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone: string | null;

  @OneToMany(() => WishlistItem, (item) => item.destination)
  wishlistItems: WishlistItem[];
}
