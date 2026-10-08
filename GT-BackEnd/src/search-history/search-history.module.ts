import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../database/entities/destination.entity';
import { SearchHistory } from '../database/entities/search-history.entity';
import { SearchHistoryService } from './search-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([SearchHistory, Destination])],
  providers: [SearchHistoryService],
  exports: [SearchHistoryService],
})
export class SearchHistoryModule {}
