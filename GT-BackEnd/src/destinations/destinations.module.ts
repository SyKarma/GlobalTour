import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../database/entities/destination.entity';
import { TravelpayoutsModule } from '../travelpayouts/travelpayouts.module';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Destination]), TravelpayoutsModule],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
