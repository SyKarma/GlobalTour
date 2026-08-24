import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiCache } from '../database/entities/api-cache.entity';
import { AppCacheService } from './cache/app-cache.service';
import { HttpClientService } from './http/http-client.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiCache])],
  providers: [HttpClientService, AppCacheService],
  exports: [HttpClientService, AppCacheService],
})
export class CommonModule {}
