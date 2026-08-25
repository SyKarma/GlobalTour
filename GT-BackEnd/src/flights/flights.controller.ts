import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarFlightsDto } from './dto/calendar-flights.dto';
import { HistoryFlightsDto } from './dto/history-flights.dto';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { FlightsService } from './flights.service';

@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flights: FlightsService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Compare flight offers between two cities',
    description:
      'Aviasales cached prices, not a live GDS. Exact YYYY-MM-DD round trips are often empty. Search then falls back to one-way that day, then to /calendar days in the departure or return month.',
  })
  @ApiOkResponse({ description: 'Indicative flight offers sorted by price' })
  search(@Query() query: SearchFlightsDto) {
    return this.flights.search(query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Cheapest flight price per departure day' })
  @ApiOkResponse({ description: 'Daily price points for charts' })
  calendar(@Query() query: CalendarFlightsDto) {
    return this.flights.calendar(query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Cheapest flight price grouped by month' })
  @ApiOkResponse({ description: 'Monthly price trend points' })
  history(@Query() query: HistoryFlightsDto) {
    return this.flights.history(query);
  }
}
