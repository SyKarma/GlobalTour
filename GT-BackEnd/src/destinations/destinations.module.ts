import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../database/entities/destination.entity';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { TravelpayoutsModule } from '../travelpayouts/travelpayouts.module';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Destination]),
    TravelpayoutsModule,
    SearchHistoryModule,
  ],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
