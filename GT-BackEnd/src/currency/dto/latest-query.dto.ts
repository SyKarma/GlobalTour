import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';
import { IsCurrencyCode } from './currency-code';

export class LatestQueryDto {
  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsCurrencyCode()
  base?: string = 'USD';

  @ApiPropertyOptional({
    example: 'EUR,GBP,MXN',
    description: 'Comma-separated quote currencies',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @Matches(/^[A-Z]{3}(,[A-Z]{3})*$/, {
    message: 'quotes must be comma-separated ISO currency codes',
  })
  quotes?: string;
}
