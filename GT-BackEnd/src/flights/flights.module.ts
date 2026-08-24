import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { TravelpayoutsModule } from '../travelpayouts/travelpayouts.module';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  imports: [TravelpayoutsModule, CurrencyModule],
  controllers: [FlightsController],
  providers: [FlightsService],
  exports: [FlightsService],
})
export class FlightsModule {}
