import { Module } from '@nestjs/common';
import { DestinationsModule } from '../destinations/destinations.module';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [DestinationsModule, SearchHistoryModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
