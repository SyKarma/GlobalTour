import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Public search analytics for charts',
    description:
      'Aggregated guest and signed-in searches. Returns top destinations, countries, origins, routes, restaurant and car cities, volume, and travel months. No personal data. Login is not required.',
  })
  @ApiOkResponse({ description: 'Aggregated search analytics' })
  get(@Query() query: DashboardQueryDto) {
    return this.dashboard.getAnalytics(query);
  }
}
