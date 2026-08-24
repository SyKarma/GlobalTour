import { Module } from '@nestjs/common';
import { TravelpayoutsClient } from './travelpayouts.client';

@Module({
  providers: [TravelpayoutsClient],
  exports: [TravelpayoutsClient],
})
export class TravelpayoutsModule {}
