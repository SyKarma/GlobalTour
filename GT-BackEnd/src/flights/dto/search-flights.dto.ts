import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { IsCurrencyCode } from '../../currency/dto/currency-code';
import { IsIataCode } from '../../common/dto/iata';

export class SearchFlightsDto {
  @ApiProperty({ example: 'MAD' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIataCode()
  origin!: string;

  @ApiProperty({ example: 'BCN' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIataCode()
  destination!: string;

  @ApiPropertyOptional({
    example: '2026-09',
    description:
      'YYYY-MM lists cheapest departures that month (one-way dump). YYYY-MM-DD is a specific day. Pair a month with a return day only if Aviasales has that round trip; otherwise search falls back to one-way month prices (same source as /calendar).',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'departureAt must be YYYY-MM or YYYY-MM-DD',
  })
  departureAt?: string;

  @ApiPropertyOptional({
    example: '2026-09-20',
    description:
      'Round-trip return date. Use YYYY-MM-DD with a YYYY-MM-DD departure. A month departure plus a specific return day is often empty in the Aviasales dump.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'returnAt must be YYYY-MM or YYYY-MM-DD',
  })
  returnAt?: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsCurrencyCode()
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsBoolean()
  direct?: boolean;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
