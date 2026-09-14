import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchHistory } from '../database/entities/search-history.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([SearchHistory])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
