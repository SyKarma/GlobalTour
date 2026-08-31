import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from '../search-history/search-history.service';
import { SearchRestaurantsDto } from './dto/search-restaurants.dto';
import { RestaurantsService } from './restaurants.service';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurants: RestaurantsService,
    private readonly searchHistory: SearchHistoryService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search restaurants near a destination city',
    description:
      'Find restaurants near any city OSM can geocode. Pass countryCode to disambiguate names that exist in more than one country. Optional filters: type, cuisine, q, hasWebsite.',
  })
  @ApiOkResponse({
    description:
      'Nearby restaurants from OpenStreetMap. Click-out only; no booking.',
  })
  async search(@Query() query: SearchRestaurantsDto) {
    const result = await this.restaurants.search(query);
    this.searchHistory.recordRestaurant(query, result.meta.iata);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Restaurant details from OpenStreetMap' })
  @ApiOkResponse({ description: 'Place profile with hours and contact links' })
  getById(@Param('id') id: string) {
    return this.restaurants.getById(id);
  }
}
