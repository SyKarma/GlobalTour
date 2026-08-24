import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('currency_rates')
@Unique('UQ_currency_rates_date_pair', [
  'rateDate',
  'baseCurrency',
  'quoteCurrency',
])
export class CurrencyRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rate_date', type: 'date' })
  rateDate: string;

  @Column({ name: 'base_currency', type: 'char', length: 3 })
  baseCurrency: string;

  @Column({ name: 'quote_currency', type: 'char', length: 3 })
  quoteCurrency: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate: string;
}
