import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRate } from '../database/entities/currency-rate.entity';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { FrankfurterClient } from './frankfurter.client';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyRate])],
  controllers: [CurrencyController],
  providers: [CurrencyService, FrankfurterClient],
  exports: [CurrencyService],
})
export class CurrencyModule {}
