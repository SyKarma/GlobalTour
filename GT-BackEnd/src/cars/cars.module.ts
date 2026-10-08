import { Module } from '@nestjs/common';
import { DestinationsModule } from '../destinations/destinations.module';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

@Module({
  imports: [DestinationsModule, SearchHistoryModule],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
