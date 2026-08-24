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
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIataCode()
  origin: string;

  @ApiProperty({ example: 'BCN' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIataCode()
  destination: string;

  @ApiPropertyOptional({ example: '2026-09', description: 'YYYY-MM or YYYY-MM-DD' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'departureAt must be YYYY-MM or YYYY-MM-DD',
  })
  departureAt?: string;

  @ApiPropertyOptional({ example: '2026-09-20' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'returnAt must be YYYY-MM or YYYY-MM-DD',
  })
  returnAt?: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsCurrencyCode()
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
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
