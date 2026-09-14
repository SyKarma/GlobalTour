import { Module } from '@nestjs/common';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { LiteApiClient } from './liteapi.client';

@Module({
  imports: [SearchHistoryModule],
  controllers: [HotelsController],
  providers: [HotelsService, LiteApiClient],
  exports: [HotelsService],
})
export class HotelsModule {}
