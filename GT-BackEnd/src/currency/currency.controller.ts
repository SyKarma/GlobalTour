import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { ConvertQueryDto } from './dto/convert-query.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { LatestQueryDto } from './dto/latest-query.dto';

@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  @ApiOperation({ summary: 'List supported currencies' })
  @ApiOkResponse({ description: 'ISO currencies from Frankfurter' })
  getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Latest daily exchange rates' })
  @ApiOkResponse({ description: 'Latest ECB-based rates (cached 24h)' })
  getLatest(@Query() query: LatestQueryDto) {
    return this.currencyService.getLatest(query);
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert an amount between two currencies' })
  @ApiOkResponse({ description: 'Converted amount using the latest daily rate' })
  convert(@Query() query: ConvertQueryDto) {
    return this.currencyService.convert(query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historical exchange rates for charts' })
  @ApiOkResponse({ description: 'Daily rates between two dates' })
  getHistory(@Query() query: HistoryQueryDto) {
    return this.currencyService.getHistory(query);
  }
}
