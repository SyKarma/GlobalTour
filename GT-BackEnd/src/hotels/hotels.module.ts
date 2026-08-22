import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { LiteApiClient } from './liteapi.client';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService, LiteApiClient],
  exports: [HotelsService],
})
export class HotelsModule {}
