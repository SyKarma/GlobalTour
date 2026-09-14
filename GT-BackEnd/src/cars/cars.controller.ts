import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from '../search-history/search-history.service';
import { SearchCarsDto } from './dto/search-cars.dto';
import { CarsService } from './cars.service';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(
    private readonly cars: CarsService,
    private readonly searchHistory: SearchHistoryService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search rental car locations near a city',
    description:
      'Map pins from OpenStreetMap (car_rental and car_sharing). Locations only — no rates or booking.',
  })
  @ApiOkResponse({
    description:
      'Nearby rental offices and car-sharing stations. Click-out only.',
  })
  async search(@Query() query: SearchCarsDto) {
    const result = await this.cars.search(query);
    this.searchHistory.recordCar(query, result.meta.iata);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Rental car location details from OpenStreetMap' })
  @ApiOkResponse({ description: 'Place profile with hours and contact links' })
  getById(@Param('id') id: string) {
    return this.cars.getById(id);
  }
}
