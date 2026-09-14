import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from '../search-history/search-history.service';
import { DestinationsService } from './destinations.service';
import { SearchDestinationsDto } from './dto/search-destinations.dto';

@ApiTags('destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(
    private readonly destinations: DestinationsService,
    private readonly searchHistory: SearchHistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search destinations by city, country, or IATA',
    description:
      'City-first autocomplete. Returns flightable cities so users can pick San José, Costa Rica (SJO) without knowing airport codes. Non-flightable duplicates such as SYQ are hidden unless the user types that IATA exactly.',
  })
  @ApiOkResponse({ description: 'Matching destinations' })
  async search(@Query() query: SearchDestinationsDto) {
    const result = await this.destinations.search(query);
    if (query.q || query.country) {
      this.searchHistory.recordDestination(
        query,
        result.data[0]?.cityIata ?? null,
      );
    }
    return result;
  }

  @Post('sync')
  @ApiOperation({ summary: 'Refresh destination catalog from TravelPayouts' })
  @ApiOkResponse({ description: 'Catalog sync result' })
  sync() {
    return this.destinations.syncFromTravelpayouts();
  }

  @Get(':iata')
  @ApiOperation({ summary: 'Get a destination by city IATA code' })
  @ApiOkResponse({ description: 'Destination detail' })
  getByIata(@Param('iata') iata: string) {
    return this.destinations.getByIata(iata);
  }
}
