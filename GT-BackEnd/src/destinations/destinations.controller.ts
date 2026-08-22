import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { SearchDestinationsDto } from './dto/search-destinations.dto';

@ApiTags('destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: 'Search destinations by city, country, or IATA' })
  @ApiOkResponse({ description: 'Matching destinations' })
  search(@Query() query: SearchDestinationsDto) {
    return this.destinations.search(query);
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
