import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from '../search-history/search-history.service';
import { HotelRatesDto } from './dto/hotel-rates.dto';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { HotelsService } from './hotels.service';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(
    private readonly hotels: HotelsService,
    private readonly searchHistory: SearchHistoryService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search hotels by country and city' })
  @ApiOkResponse({ description: 'Hotel listings with images and ratings' })
  async search(@Query() query: SearchHotelsDto) {
    const result = await this.hotels.search(query);
    this.searchHistory.recordHotel(query);
    return result;
  }

  @Get(':id/rates')
  @ApiOperation({ summary: 'Indicative room rates for a hotel' })
  @ApiOkResponse({ description: 'Availability and pricing for the stay dates' })
  getRates(@Param('id') id: string, @Query() query: HotelRatesDto) {
    return this.hotels.getRates(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Hotel details, amenities, and images' })
  @ApiOkResponse({ description: 'Hotel profile' })
  getById(@Param('id') id: string) {
    return this.hotels.getById(id);
  }
}
